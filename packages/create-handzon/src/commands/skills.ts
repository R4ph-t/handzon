import { spawn } from "node:child_process";
import * as p from "@clack/prompts";
import pc from "picocolors";

/**
 * GitHub URL the `skills` CLI installs from. Points at the canonical
 * SKILL.md files in the handzon repo. Bump the branch/path here when
 * the repo layout changes.
 */
export const SKILLS_SOURCE =
  "https://github.com/R4ph-t/handzon/tree/main/templates/default/skills";

interface SkillsOptions {
  yes?: boolean;
}

/**
 * Install the authoring skills into the user's AI agent (Cursor, Claude
 * Code, Codex, etc.) by shelling out to the `skills` CLI. The skills
 * help an agent author tutorials in a Handzon project (add-tutorial,
 * add-step, add-quiz, deploy-to-render, ...).
 */
export async function runSkills(opts: SkillsOptions = {}): Promise<void> {
  p.intro(pc.bgMagenta(pc.black(" create-handzon skills ")));

  if (!opts.yes) {
    const ok = await p.confirm({
      message: `Install Handzon authoring skills into your AI agent? (runs \`npx skills add\` from ${SKILLS_SOURCE})`,
      initialValue: true,
    });
    if (p.isCancel(ok) || !ok) {
      p.cancel("Cancelled.");
      process.exit(0);
    }
  }

  await installSkillsInteractive();
}

/**
 * Spawn `npx skills add <url>` in the current working directory and
 * stream its output. Returns true on success, false otherwise — caller
 * decides whether a failure should be fatal (init: warn, subcommand:
 * exit non-zero).
 */
export async function installSkillsInteractive(cwd: string = process.cwd()): Promise<boolean> {
  const s = p.spinner();
  s.start("Running `npx skills add` (this picks your agent interactively)");
  s.stop("Handing off to the skills CLI…");

  return await new Promise<boolean>((resolve) => {
    const child = spawn("npx", ["--yes", "skills", "add", SKILLS_SOURCE], {
      cwd,
      stdio: "inherit",
    });
    child.on("exit", (code) => {
      if (code === 0) {
        p.outro(pc.green("Skills installed."));
        resolve(true);
      } else {
        p.log.warn(
          `\`npx skills add\` exited with code ${code}. You can retry later with \`pnpm handzon:skills\`.`,
        );
        resolve(false);
      }
    });
    child.on("error", (err) => {
      p.log.warn(`Failed to spawn npx: ${err.message}`);
      resolve(false);
    });
  });
}
