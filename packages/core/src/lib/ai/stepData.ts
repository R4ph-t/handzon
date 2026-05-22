import type { AssistantContext } from "./context";

/**
 * Reads the per-step JSON payload that TutorialLayout emits into
 * `<script id="tt-step-data" type="application/json">`. Family B
 * touchpoints (CopyPrompt, deep-link row, copy-step button, …) need
 * the raw MDX source and tutorial/step titles at click time without
 * having every island accept them as props.
 */
export interface StepData {
  tutorialSlug: string;
  tutorialTitle: string;
  stepSlug: string;
  stepTitle: string;
  stepSource: string;
}

export function readStepData(): StepData | null {
  if (typeof document === "undefined") return null;
  const node = document.getElementById("tt-step-data");
  if (!node?.textContent) return null;
  try {
    return JSON.parse(node.textContent) as StepData;
  } catch {
    return null;
  }
}

/**
 * Render a CopyPrompt template by substituting `{{placeholder}}`
 * tokens with the values from step data. Unknown placeholders are
 * left untouched so authors notice typos.
 */
export function renderTemplate(template: string, data: StepData): string {
  const map: Record<string, string> = {
    tutorialTitle: data.tutorialTitle,
    tutorialSlug: data.tutorialSlug,
    stepTitle: data.stepTitle,
    stepSlug: data.stepSlug,
    stepSource: data.stepSource,
  };
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (raw, key) => {
    return key in map ? map[key] : raw;
  });
}

/**
 * Construct a minimal AssistantContext from client-side step data
 * for Family B touchpoints that need to call buildAssistantPrompt
 * without the build-time context that ChatButton holds. Fields we
 * don't know client-side (difficulty, tags, outline, prior steps,
 * progress) come back empty; the intents that Family B uses
 * (explainStep, recap) only read tutorial + currentStep.
 */
export function contextFromStepData(data: StepData): AssistantContext {
  return {
    tutorial: {
      slug: data.tutorialSlug,
      title: data.tutorialTitle,
      description: "",
      difficulty: "",
      tags: [],
    },
    outline: [],
    currentStep: {
      slug: data.stepSlug,
      title: data.stepTitle,
      source: data.stepSource,
    },
    priorSteps: [],
    progress: { completed: [], quizzes: [], checkpoints: [] },
    references: [],
  };
}
