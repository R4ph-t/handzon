import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { cp, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import * as p from "@clack/prompts";
import pc from "picocolors";
import { ask } from "../shared/ask";
import { writeDevEnv, writeDevScripts } from "../shared/dev-config";
import { replaceProjectName } from "../shared/render-template";
import { installSkillsInteractive } from "./skills";
import { isValidSlug, slugify } from "../shared/slugify";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function resolveTemplateDir(): string {
  // In published builds: dist/template. In monorepo dev: ../../../templates/default
  const bundled = resolve(__dirname, "template");
  if (existsSync(bundled)) return bundled;
  return resolve(__dirname, "../../../templates/default");
}

interface InitOptions {
  targetName?: string;
  yes?: boolean;
}

export async function runInit(opts: InitOptions = {}): Promise<void> {
  p.intro(pc.bgMagenta(pc.black(" create-handzon ")));

  const shouldPrompt = !opts.yes;
  const defaultName = opts.targetName ?? "my-codelab";

  const projectName = await ask(shouldPrompt, defaultName, () =>
    p.text({
      message: "Project name",
      placeholder: defaultName,
      defaultValue: defaultName,
      validate: (v) =>
        isValidSlug(slugify(v || defaultName))
          ? undefined
          : "Use lowercase letters, numbers, and dashes.",
    }),
  );

  const slug = slugify(projectName);
  const targetDir = resolve(process.cwd(), slug);
  if (existsSync(targetDir)) {
    p.log.error(`Directory "${slug}" already exists. Pick a different name or delete it first.`);
    process.exit(1);
  }

  const theme = await ask(shouldPrompt, "brutalist-dark", () =>
    p.select({
      message: "Theme preset",
      options: [
        { value: "brutalist-dark", label: "brutalist-dark (default)" },
        { value: "brutalist-light", label: "brutalist-light" },
        { value: "classic", label: "classic (softer)" },
      ],
    }),
  );

  const aiEnabled = await ask(shouldPrompt, true, () =>
    p.confirm({ message: "Enable the AI assistant?", initialValue: true }),
  );

  const assistantName = aiEnabled
    ? await ask(shouldPrompt, "Helper", () =>
      p.text({ message: "Assistant name", placeholder: "Helper", defaultValue: "Helper" }),
    )
    : "Helper";

  const byok = aiEnabled
    ? await ask(shouldPrompt, "required" as const, () =>
      p.select({
        message: "BYOK mode",
        options: [
          { value: "required", label: "required — learner provides their key" },
          { value: "optional", label: "optional — you can also provide a server key" },
          { value: "disabled", label: "disabled — no AI helper" },
        ],
      }),
    )
    : "disabled";

  const tier2 = await ask(shouldPrompt, false, () =>
    p.confirm({
      message: "Set up Postgres-backed cross-device sync? (Tier 2)",
      initialValue: false,
    }),
  );

  const packageManager = await ask(shouldPrompt, "pnpm" as const, () =>
    p.select({
      message: "Package manager",
      options: [
        { value: "pnpm", label: "pnpm" },
        { value: "npm", label: "npm" },
        { value: "yarn", label: "yarn" },
        { value: "bun", label: "bun" },
      ],
    }),
  );

  const install = await ask(shouldPrompt, true, () =>
    p.confirm({ message: "Install dependencies now?", initialValue: true }),
  );

  const initGit = await ask(shouldPrompt, true, () =>
    p.confirm({ message: "Initialize git?", initialValue: true }),
  );

  // Skills install runs after the scaffold so the user can see what was
  // created first. Default off in --yes mode because it requires an
  // interactive agent picker.
  const installSkills = await ask(shouldPrompt, false, () =>
    p.confirm({
      message: "Install Handzon authoring skills into your AI agent? (Cursor, Claude Code, …)",
      initialValue: true,
    }),
  );

  const s = p.spinner();
  s.start("Copying template");
  const templateDir = resolveTemplateDir();
  // Filter on path SEGMENTS relative to templateDir — not on the full
  // absolute path. The npx cache lives under `node_modules/`, so a
  // substring check on the absolute source path matches every file and
  // silently excludes the whole template (the spinner still says
  // "Template copied" but the target is empty).
  //
  // skills/ + .cursor/ + .claude/ are intentionally excluded — they
  // ship to the user's AI agent on demand via `npx skills add`, not as
  // files inside the scaffold (see commands/skills.ts).
  const EXCLUDED_SEGMENTS = new Set([
    "node_modules",
    ".astro",
    "skills",
    ".cursor",
    ".claude",
  ]);
  await cp(templateDir, targetDir, {
    recursive: true,
    // Preserve .cursor/skills + .claude/skills symlinks rather than
    // dereferencing them and copying their target into themselves.
    verbatimSymlinks: true,
    filter: (src) => {
      const rel = relative(templateDir, src);
      if (!rel || rel.startsWith("..")) return true;
      return !rel.split(sep).some((seg) => EXCLUDED_SEGMENTS.has(seg));
    },
  });

  // npm strips dotfiles like `.gitignore` and `.npmrc` from the
  // published tarball (it treats those names as filtering directives,
  // not files to ship). The template stores them without the leading
  // dot; restore it in the scaffold so they actually take effect.
  for (const name of ["gitignore", "npmrc"]) {
    const src = join(targetDir, name);
    if (existsSync(src)) await rename(src, join(targetDir, `.${name}`));
  }

  s.stop("Template copied");

  s.start("Applying answers");
  await replaceProjectName(join(targetDir, "package.json"), slug);
  await replaceProjectName(join(targetDir, "README.md"), slug);
  await replaceProjectName(join(targetDir, "render.yaml"), slug);
  await replaceProjectName(join(targetDir, "render.full.yaml"), slug);

  // Theme: swap the @import in global.css if needed.
  if (theme !== "brutalist-dark") {
    const cssPath = join(targetDir, "src/styles/global.css");
    const css = await readFile(cssPath, "utf8");
    await writeFile(cssPath, css.replace("./themes/brutalist-dark.css", `./themes/${theme}.css`));
  }

  // AI config: overwrite src/config/ai.ts with the user's picks.
  await writeFile(
    join(targetDir, "src/config/ai.ts"),
    `export const aiDefaults = {
  enabled: ${aiEnabled},
  name: ${JSON.stringify(assistantName)},
  tagline: undefined as string | undefined,
  greeting: undefined as string | undefined,
  avatar: undefined as string | undefined,
  persona: undefined as string | undefined,
  provider: "anthropic" as "anthropic" | "openai" | "google" | "openai-compatible",
  model: "claude-sonnet-4-5",
  byok: ${JSON.stringify(byok)} as "required" | "optional" | "disabled",
  tone: "socratic" as "socratic" | "direct" | "encouraging",
  contextBudgetTokens: 8000,
  includeFutureSteps: false,
  tools: { suggestPlaygroundEdit: false },
};

export type AiConfig = typeof aiDefaults;
`,
  );

  // Tier 1 vs Tier 2: prune the file the user didn't pick.
  if (!tier2) {
    await rm(join(targetDir, "render.full.yaml"), { force: true });
    // Tier 1 has no DB, so docker-compose is dead weight.
    await rm(join(targetDir, "docker-compose.yml"), { force: true });
  } else {
    // Promote render.full.yaml to render.yaml (Tier 2 default).
    await rm(join(targetDir, "render.yaml"), { force: true });
    await rename(join(targetDir, "render.full.yaml"), join(targetDir, "render.yaml"));
  }

  // Tailor the package.json `dev` script to what the user actually
  // wants running locally (site + AI + Postgres in any combination),
  // and write a single root-level `.env` with localhost defaults so
  // `pnpm dev` works on first try. Both Astro and the AI service load
  // from this one file — no per-service .env to maintain.
  await writeDevScripts(join(targetDir, "package.json"), { aiEnabled, tier2 });
  await writeDevEnv(join(targetDir, ".env"), { aiEnabled, tier2 });

  s.stop("Configured");

  if (install) {
    s.start(`Installing dependencies with ${packageManager}`);
    // Pipe stdio so the spinner has the line to itself — `stdio: "inherit"`
    // makes pnpm's progress writer fight the spinner and produces the
    // garbled overlap users were seeing. Buffer everything in case we
    // need to surface it on failure.
    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];
    const result = await new Promise<{ ok: boolean; combined: string }>((resolveInstall) => {
      const child = spawn(packageManager, ["install"], {
        cwd: targetDir,
        stdio: ["ignore", "pipe", "pipe"],
      });
      child.stdout?.on("data", (c: Buffer) => stdoutChunks.push(c));
      child.stderr?.on("data", (c: Buffer) => stderrChunks.push(c));
      const done = (ok: boolean) =>
        resolveInstall({
          ok,
          combined:
            Buffer.concat(stdoutChunks).toString("utf8") +
            Buffer.concat(stderrChunks).toString("utf8"),
        });
      child.on("exit", (code) => done(code === 0));
      child.on("error", (err) => {
        stderrChunks.push(Buffer.from(err.message));
        done(false);
      });
    });
    if (result.ok) {
      s.stop("Dependencies installed");
    } else {
      s.stop(`${packageManager} install failed`);
      if (result.combined.trim()) {
        p.log.error(result.combined.trim());
      }
      p.log.info(
        `You can finish the install yourself with \`cd ${slug} && ${packageManager} install\`.`,
      );
    }
  }

  if (initGit) {
    s.start("Initializing git");
    await new Promise<void>((res, rej) => {
      const child = spawn("git", ["init"], { cwd: targetDir, stdio: "ignore" });
      child.on("exit", (code) => (code === 0 ? res() : rej(new Error(`git init exited ${code}`))));
    }).catch(() => { });
    s.stop("Git initialized");
  }

  if (installSkills) {
    await installSkillsInteractive(targetDir);
  }

  const devProcs = describeDevProcs({ aiEnabled, tier2 });
  const tier2Notice = tier2
    ? `\n\n  Tier 2 needs Docker for the local Postgres. If you don't have it,\n  install OrbStack / Docker Desktop / Colima, or set DATABASE_URL\n  to your own Postgres in .env and skip \`pnpm dev:db\`.`
    : "";
  const skillsHint = installSkills
    ? ""
    : "\n\n  Want the authoring skills later? Run `pnpm handzon:skills`.";

  p.outro(
    pc.green("Done!") +
    `\n\n  cd ${slug}\n  ${packageManager} dev   ${pc.dim(`# ${devProcs}`)}\n\n  Then open http://localhost:4321` +
    tier2Notice +
    skillsHint,
  );
}

function describeDevProcs({ aiEnabled, tier2 }: { aiEnabled: boolean; tier2: boolean }): string {
  const procs = [tier2 && "db", "site", aiEnabled && "ai"].filter(Boolean);
  return procs.length > 1 ? `runs ${procs.join(" + ")} in parallel` : "runs astro dev";
}
