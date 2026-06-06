import type { StepEntry, TutorialEntry } from "../content";
import { parseStepId } from "../content";
import type { ProgressState } from "../progress/types";
import { stripInactiveTrackBlocks } from "../track-source";
import type { TrackOption } from "../tracks";

export interface AssistantContext {
  tutorial: {
    slug: string;
    title: string;
    description: string;
    difficulty: string;
    tags: string[];
    tracks: TrackOption[];
    defaultTrack?: string;
    track?: string | null;
  };
  outline: Array<{ slug: string; title: string; completed: boolean; current: boolean }>;
  currentStep: {
    slug: string;
    title: string;
    source: string;
  };
  priorSteps: Array<{ slug: string; title: string; source: string }>;
  progress: {
    completed: string[];
    quizzes: Array<{ id: string; correct: boolean }>;
    checkpoints: string[];
  };
  references: Array<{ source: string; content: string }>;
}

interface BuildOptions {
  tutorial: TutorialEntry;
  steps: StepEntry[];
  currentStep: StepEntry;
  progress: ProgressState;
  references?: Array<{ source: string; content: string }>;
  includeFutureSteps?: boolean;
  activeTrack?: string;
}

/**
 * Assemble the per-request context. Prior-step bodies are inlined verbatim
 * so the assistant has the same view of the work as the learner. Future
 * steps are excluded by default to avoid spoilers.
 */
export function buildContext({
  tutorial,
  steps,
  currentStep,
  progress,
  references = [],
  includeFutureSteps = false,
  activeTrack,
}: BuildOptions): AssistantContext {
  const slug = tutorial.id;
  const currentIdx = steps.findIndex((s) => s.id === currentStep.id);
  const { stepSlug: currentSlug } = parseStepId(currentStep.id);

  const outline = steps.map((s) => {
    const { stepSlug } = parseStepId(s.id);
    return {
      slug: stepSlug,
      title: s.data.title,
      completed: progress.steps[`${slug}/${stepSlug}`] === "complete",
      current: stepSlug === currentSlug,
    };
  });

  const priorSteps = steps
    .slice(0, includeFutureSteps ? steps.length : currentIdx)
    .filter((s) => s.id !== currentStep.id)
    .map((s) => ({
      slug: parseStepId(s.id).stepSlug,
      title: s.data.title,
      source: stripInactiveTrackBlocks(s.body ?? "", activeTrack),
    }));

  return {
    tutorial: {
      slug,
      title: tutorial.data.title,
      description: tutorial.data.description,
      difficulty: tutorial.data.difficulty,
      tags: tutorial.data.tags,
      tracks: tutorial.data.tracks,
      defaultTrack: tutorial.data.defaultTrack,
      track: activeTrack ?? null,
    },
    outline,
    currentStep: {
      slug: currentSlug,
      title: currentStep.data.title,
      source: stripInactiveTrackBlocks(currentStep.body ?? "", activeTrack),
    },
    priorSteps,
    progress: {
      completed: Object.entries(progress.steps)
        .filter(([k, v]) => k.startsWith(`${slug}/`) && v === "complete")
        .map(([k]) => k.split("/").slice(1).join("/")),
      quizzes: Object.entries(progress.quizzes).map(([id, q]) => ({ id, correct: q.correct })),
      checkpoints: Object.keys(progress.checkpoints),
    },
    references,
  };
}
