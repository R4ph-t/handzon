import { readFile, writeFile } from "node:fs/promises";

interface Picks {
  aiEnabled: boolean;
  tier2: boolean;
}

interface PackageJson {
  scripts?: Record<string, string>;
  devDependencies?: Record<string, string>;
  [k: string]: unknown;
}

/**
 * Mutate the scaffolded `package.json` in place: set up a tailored
 * `dev` script that orchestrates whichever processes the user's tier +
 * AI picks require (Astro, AI service, Postgres). Granular per-process
 * scripts (`dev:site`, `dev:ai`, `dev:db`) are always written so users
 * can run them individually too.
 */
export async function writeDevScripts(packageJsonPath: string, picks: Picks): Promise<void> {
  const raw = await readFile(packageJsonPath, "utf8");
  const pkg = JSON.parse(raw) as PackageJson;
  const scripts: Record<string, string> = { ...(pkg.scripts ?? {}) };
  const devDeps: Record<string, string> = { ...(pkg.devDependencies ?? {}) };

  scripts["dev:site"] = "astro dev";
  if (picks.aiEnabled) {
    scripts["dev:ai"] = "pnpm exec handzon-ai";
  } else {
    delete scripts["dev:ai"];
  }
  if (picks.tier2) {
    scripts["dev:db"] = "docker compose up postgres";
  } else {
    delete scripts["dev:db"];
  }

  scripts.dev = composeDevCommand(picks);

  if (picks.aiEnabled || picks.tier2) {
    devDeps.concurrently = "^9.1.0";
  }

  pkg.scripts = sortObject(scripts);
  pkg.devDependencies = sortObject(devDeps);

  await writeFile(packageJsonPath, `${JSON.stringify(pkg, null, 2)}\n`, "utf8");
}

function composeDevCommand({ aiEnabled, tier2 }: Picks): string {
  const procs: Array<{ name: string; color: string; script: string }> = [];
  if (tier2) procs.push({ name: "db", color: "yellow", script: "pnpm dev:db" });
  procs.push({ name: "site", color: "blue", script: "pnpm dev:site" });
  if (aiEnabled) procs.push({ name: "ai", color: "magenta", script: "pnpm dev:ai" });

  if (procs.length === 1) return procs[0]!.script;

  const names = procs.map((p) => p.name).join(",");
  const colors = procs.map((p) => p.color).join(",");
  const scripts = procs.map((p) => `"${p.script}"`).join(" ");
  return `concurrently -k -n ${names} -c ${colors} ${scripts}`;
}

function sortObject<T extends Record<string, unknown>>(o: T): T {
  return Object.fromEntries(Object.entries(o).sort(([a], [b]) => a.localeCompare(b))) as T;
}

/**
 * Write a single root-level `.env` with sensible local-dev defaults.
 * Both the Astro site (auto-loaded) and the AI service (via
 * dotenv.config({path:"../../../.env"}) in server.ts) read from this
 * same file. Skips overwriting an existing file. Pairs with the
 * `.env.example` that ships in the template as documentation.
 */
export async function writeDevEnv(envPath: string, picks: Picks): Promise<void> {
  const lines: string[] = [
    "# Local-dev defaults. Shared by the Astro site and the AI service.",
    "# In production each var is set via your hosting platform (Render Blueprint).",
    "",
    "# --- Site ---",
    "SITE_URL=http://localhost:4321",
  ];

  if (picks.aiEnabled) {
    lines.push("PUBLIC_AI_SERVICE_URL=http://localhost:4111");
  }

  if (picks.tier2) {
    lines.push("PUBLIC_PROGRESS_BACKEND=remote");
    lines.push("");
    lines.push("# --- Database (Tier 2) ---");
    lines.push("DATABASE_URL=postgres://handzon:handzon@localhost:5432/handzon");
  }

  if (picks.aiEnabled) {
    lines.push("");
    lines.push("# --- AI service ---");
    lines.push("ALLOWED_ORIGIN=http://localhost:4321");
    lines.push("");
    lines.push("# Uncomment + set ONE provider key matching your src/config/ai.ts.");
    lines.push("# Leave commented if you're using BYOK only.");
    lines.push("# ANTHROPIC_API_KEY=");
    lines.push("# OPENAI_API_KEY=");
    lines.push("# GOOGLE_GENERATIVE_AI_API_KEY=");
    lines.push("# OPENAI_COMPATIBLE_API_KEY=");
    lines.push("# OPENAI_COMPATIBLE_BASE_URL=https://api.groq.com/openai/v1");
  }

  await writeFile(envPath, `${lines.join("\n")}\n`, { flag: "wx" }).catch((err) => {
    if ((err as NodeJS.ErrnoException).code !== "EEXIST") throw err;
    // .env already present — don't clobber whatever the user has.
  });
}
