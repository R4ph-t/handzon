import type { StarterSpec, VerifySpec } from "../../collections.ts";
import { type McpTool, text } from "./protocol.ts";

interface StartTutorialStep {
  slug: string;
  order: number;
  title: string;
  summary?: string;
  duration?: string;
  verify?: VerifySpec | null;
}

interface StartTutorialInput {
  tutorial: {
    slug: string;
    title: string;
    description: string;
    difficulty: string;
    tags: string[];
    starter?: StarterSpec;
  };
  steps: StartTutorialStep[];
  workspaceName?: string;
}

export type LoadStartTutorial = (
  slug: string,
) => Promise<Omit<StartTutorialInput, "workspaceName"> | null>;

export interface StartTutorialPayload {
  tutorial: {
    slug: string;
    title: string;
    description: string;
    difficulty: string;
    tags: string[];
  };
  starter: StarterSpec | null;
  workspace: {
    targetDir: string;
    openPath: string;
  };
  commands: string[];
  firstStep: StartTutorialStep;
  next: string[];
}

function pathForCommand(...parts: string[]) {
  return parts.filter(Boolean).join("/");
}

function resolveTargetDir(
  slug: string,
  starter: StarterSpec | undefined,
  workspaceName: string | undefined,
) {
  return workspaceName ?? starter?.targetDir ?? slug;
}

function resolveOpenPath(targetDir: string, starter: StarterSpec | undefined) {
  if (!starter) return targetDir;
  if (starter.openPath) {
    return starter.openPath === "." ? targetDir : starter.openPath;
  }
  if (starter.kind === "git" && starter.subdir) return pathForCommand(targetDir, starter.subdir);
  return targetDir;
}

function buildCommands(starter: StarterSpec | undefined, targetDir: string, openPath: string) {
  if (!starter) return [];
  const commands: string[] = [];
  if (starter.kind === "git") {
    const ref = starter.ref ? ` --branch ${starter.ref}` : "";
    commands.push(`git clone${ref} ${starter.repo} ${targetDir}`);
  } else {
    commands.push(starter.initCommand);
  }
  commands.push(`cd ${openPath}`);
  commands.push(...starter.setupCommands);
  return commands;
}

export function buildStartTutorialPayload({
  tutorial,
  steps,
  workspaceName,
}: StartTutorialInput): StartTutorialPayload {
  const [firstStep] = [...steps].sort((a, b) => a.order - b.order);
  if (!firstStep) {
    throw new Error(`Tutorial ${tutorial.slug} has no steps.`);
  }

  const targetDir = resolveTargetDir(tutorial.slug, tutorial.starter, workspaceName);
  const openPath = resolveOpenPath(targetDir, tutorial.starter);
  const commands = buildCommands(tutorial.starter, targetDir, openPath);

  return {
    tutorial: {
      slug: tutorial.slug,
      title: tutorial.title,
      description: tutorial.description,
      difficulty: tutorial.difficulty,
      tags: tutorial.tags,
    },
    starter: tutorial.starter ?? null,
    workspace: { targetDir, openPath },
    commands,
    firstStep,
    next: [
      `Call get_step with tutorial=${tutorial.slug} and step=${firstStep.slug}.`,
      "Run the step locally in the prepared workspace.",
      firstStep.verify
        ? "If the step has verify checks, collect observations and call submit_verification."
        : "If the step has only a prose checkpoint, inspect the result before calling complete_checkpoint.",
    ],
  };
}

export function createStartTutorialTool(load: LoadStartTutorial): McpTool {
  return {
    name: "start_tutorial",
    description:
      "Return local bootstrap commands and next MCP actions for starting a tutorial from a blank workspace.",
    inputSchema: {
      type: "object",
      properties: {
        slug: { type: "string", minLength: 1 },
        workspaceName: {
          type: "string",
          minLength: 1,
          description:
            "Optional local directory name to use instead of the tutorial's default targetDir.",
        },
      },
      required: ["slug"],
      additionalProperties: false,
    },
    handler: async (args) => {
      const { slug, workspaceName } = args as { slug: string; workspaceName?: string };
      const loaded = await load(slug);
      if (!loaded) {
        return {
          content: [{ type: "text", text: `No tutorial with slug "${slug}".` }],
          isError: true,
        };
      }
      return text(JSON.stringify(buildStartTutorialPayload({ ...loaded, workspaceName }), null, 2));
    },
  };
}
