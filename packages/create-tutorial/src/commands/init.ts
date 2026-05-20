import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { cp, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import * as p from "@clack/prompts";
import pc from "picocolors";
import { replaceProjectName } from "../shared/render-template";
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
  p.intro(pc.bgMagenta(pc.black(" create-tutorial ")));

  const defaultName = opts.targetName ?? "my-codelab";
  const projectName = opts.yes
    ? defaultName
    : ((await p.text({
        message: "Project name",
        placeholder: defaultName,
        defaultValue: defaultName,
        validate: (v) =>
          isValidSlug(slugify(v || defaultName))
            ? undefined
            : "Use lowercase letters, numbers, and dashes.",
      })) as string);
  if (p.isCancel(projectName)) return cancel();

  const slug = slugify(projectName);
  const targetDir = resolve(process.cwd(), slug);
  if (existsSync(targetDir)) {
    p.log.error(`Directory "${slug}" already exists. Pick a different name or delete it first.`);
    process.exit(1);
  }

  const theme = opts.yes
    ? "brutalist-dark"
    : ((await p.select({
        message: "Theme preset",
        options: [
          { value: "brutalist-dark", label: "brutalist-dark (default)" },
          { value: "brutalist-light", label: "brutalist-light" },
          { value: "classic", label: "classic (softer)" },
        ],
      })) as string);
  if (p.isCancel(theme)) return cancel();

  const aiEnabled = opts.yes
    ? true
    : ((await p.confirm({ message: "Enable the AI assistant?", initialValue: true })) as boolean);
  if (p.isCancel(aiEnabled)) return cancel();

  const assistantName = aiEnabled
    ? opts.yes
      ? "Helper"
      : ((await p.text({
          message: "Assistant name",
          placeholder: "Helper",
          defaultValue: "Helper",
        })) as string)
    : "Helper";
  if (p.isCancel(assistantName)) return cancel();

  const byok = aiEnabled
    ? opts.yes
      ? "required"
      : ((await p.select({
          message: "BYOK mode",
          options: [
            { value: "required", label: "required — learner provides their key" },
            { value: "optional", label: "optional — you can also provide a server key" },
            { value: "disabled", label: "disabled — no AI helper" },
          ],
        })) as string)
    : "disabled";
  if (p.isCancel(byok)) return cancel();

  const tier2 = opts.yes
    ? false
    : ((await p.confirm({
        message: "Set up Postgres-backed cross-device sync? (Tier 2)",
        initialValue: false,
      })) as boolean);
  if (p.isCancel(tier2)) return cancel();

  const packageManager = opts.yes
    ? "pnpm"
    : ((await p.select({
        message: "Package manager",
        options: [
          { value: "pnpm", label: "pnpm" },
          { value: "npm", label: "npm" },
          { value: "yarn", label: "yarn" },
          { value: "bun", label: "bun" },
        ],
      })) as string);
  if (p.isCancel(packageManager)) return cancel();

  const install = opts.yes
    ? true
    : ((await p.confirm({ message: "Install dependencies now?", initialValue: true })) as boolean);
  if (p.isCancel(install)) return cancel();

  const initGit = opts.yes
    ? true
    : ((await p.confirm({ message: "Initialize git?", initialValue: true })) as boolean);
  if (p.isCancel(initGit)) return cancel();

  const s = p.spinner();
  s.start("Copying template");
  const templateDir = resolveTemplateDir();
  await cp(templateDir, targetDir, {
    recursive: true,
    filter: (src) =>
      !src.includes("node_modules") && !src.endsWith("/.astro") && !src.includes("/.astro/"),
  });
  s.stop("Template copied");

  s.start("Applying answers");
  await replaceProjectName(join(targetDir, "package.json"), slug);
  await replaceProjectName(join(targetDir, "README.md"), slug);
  await replaceProjectName(join(targetDir, "render.yaml"), slug);
  await replaceProjectName(join(targetDir, "render.full.yaml"), slug);

  // Theme: swap the @import in global.css if needed.
  if (theme !== "brutalist-dark") {
    const cssPath = join(targetDir, "src/styles/global.css");
    const { readFile, writeFile } = await import("node:fs/promises");
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
  } else {
    // Promote render.full.yaml to render.yaml (Tier 2 default).
    await rm(join(targetDir, "render.yaml"), { force: true });
    const { rename } = await import("node:fs/promises");
    await rename(join(targetDir, "render.full.yaml"), join(targetDir, "render.yaml"));
  }
  s.stop("Configured");

  if (install) {
    s.start(`Installing dependencies with ${packageManager}`);
    await new Promise<void>((resolveInstall, rejectInstall) => {
      const child = spawn(packageManager, ["install"], { cwd: targetDir, stdio: "inherit" });
      child.on("exit", (code) =>
        code === 0
          ? resolveInstall()
          : rejectInstall(new Error(`${packageManager} install exited ${code}`)),
      );
    }).catch((e) => {
      s.stop("Install failed");
      p.log.warn(String(e));
    });
    s.stop("Dependencies installed");
  }

  if (initGit) {
    s.start("Initializing git");
    await new Promise<void>((res, rej) => {
      const child = spawn("git", ["init"], { cwd: targetDir, stdio: "ignore" });
      child.on("exit", (code) => (code === 0 ? res() : rej(new Error(`git init exited ${code}`))));
    }).catch(() => {});
    s.stop("Git initialized");
  }

  p.outro(
    pc.green("Done!") +
      `\n\n  cd ${slug}\n  ${packageManager} dev\n\n  Then open http://localhost:4321`,
  );
}

function cancel() {
  p.cancel("Cancelled.");
  process.exit(0);
}
