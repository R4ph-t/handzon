import type { StarterSpec, VerifySpec } from "../../collections.ts";
import {
  isStarterSpec,
  isVerifySpec,
  resolveForTrack,
  type TrackScoped,
} from "../../lib/track-scoped.ts";
import type { TrackOption } from "../../lib/tracks.ts";
import { type McpContext, type McpTool, text } from "./protocol.ts";
import { resolveMcpTrack } from "./tracks.ts";

interface StartTutorialStep {
  slug: string;
  order: number;
  title: string;
  summary?: string;
  duration?: string;
  verify?: TrackScoped<VerifySpec> | null;
}

interface StartTutorialInput {
  tutorial: {
    slug: string;
    title: string;
    description: string;
    difficulty: string;
    tags: string[];
    tracks?: TrackOption[];
    defaultTrack?: string;
    starter?: TrackScoped<StarterSpec>;
  };
  steps: StartTutorialStep[];
  workspaceName?: string;
  resolvedTrack?: string;
}

export type LoadStartTutorial = (
  slug: string,
  ctx: McpContext,
) => Promise<Omit<StartTutorialInput, "workspaceName"> | null>;

export interface StartTutorialPayload {
  tutorial: {
    slug: string;
    title: string;
    description: string;
    difficulty: string;
    tags: string[];
    tracks: TrackOption[];
    track?: string | null;
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

function resolveStarterForTrack(
  starter: TrackScoped<StarterSpec> | undefined,
  trackId: string | undefined,
) {
  return resolveForTrack(starter, trackId, isStarterSpec as (v: unknown) => v is StarterSpec);
}

function resolveVerifyForTrack(
  verify: TrackScoped<VerifySpec> | undefined,
  trackId: string | undefined,
) {
  return resolveForTrack(verify, trackId, isVerifySpec as (v: unknown) => v is VerifySpec);
}

export function buildStartTutorialPayload({
  tutorial,
  steps,
  workspaceName,
  resolvedTrack,
}: StartTutorialInput): StartTutorialPayload {
  const resolvedSteps = steps.map((step) => ({
    ...step,
    verify: resolveVerifyForTrack(step.verify ?? undefined, resolvedTrack) ?? null,
  }));
  const [firstStep] = [...resolvedSteps].sort((a, b) => a.order - b.order);
  if (!firstStep) {
    throw new Error(`Tutorial ${tutorial.slug} has no steps.`);
  }

  const starter = resolveStarterForTrack(tutorial.starter, resolvedTrack);
  const targetDir = resolveTargetDir(tutorial.slug, starter, workspaceName);
  const openPath = resolveOpenPath(targetDir, starter);
  const commands = buildCommands(starter, targetDir, openPath);

  return {
    tutorial: {
      slug: tutorial.slug,
      title: tutorial.title,
      description: tutorial.description,
      difficulty: tutorial.difficulty,
      tags: tutorial.tags,
      tracks: tutorial.tracks ?? [],
      track: resolvedTrack ?? null,
    },
    starter: starter ?? null,
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
        track: {
          type: "string",
          minLength: 1,
          description:
            "Optional tutorial track id. Overrides the learner's persisted prefs.track for this call.",
        },
      },
      required: ["slug"],
      additionalProperties: false,
    },
    handler: async (args, ctx) => {
      const { slug, workspaceName, track } = args as {
        slug: string;
        workspaceName?: string;
        track?: string;
      };
      const loaded = await load(slug, ctx);
      if (!loaded) {
        return {
          content: [{ type: "text", text: `No tutorial with slug "${slug}".` }],
          isError: true,
        };
      }
      const resolvedTrack = await resolveMcpTrack({
        tracks: loaded.tutorial.tracks,
        defaultTrack: loaded.tutorial.defaultTrack,
        explicitTrack: track,
        learnerId: ctx.learnerId,
      });
      return text(
        JSON.stringify(
          buildStartTutorialPayload({ ...loaded, workspaceName, resolvedTrack }),
          null,
          2,
        ),
      );
    },
  };
}
