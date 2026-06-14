import type { ProgressState, StepKey } from "./types";

type StepStatusMap = ProgressState["steps"];

interface GatingInput {
  tutorialSlug: string;
  stepSlugs: string[];
  steps: StepStatusMap;
}

interface StepGateInput extends GatingInput {
  stepSlug: string;
}

const stepKey = (tutorialSlug: string, stepSlug: string): StepKey => `${tutorialSlug}/${stepSlug}`;

export function firstIncompleteStep({ tutorialSlug, stepSlugs, steps }: GatingInput) {
  return stepSlugs.find((slug) => steps[stepKey(tutorialSlug, slug)] !== "complete");
}

export function firstIncompletePrerequisite({
  tutorialSlug,
  stepSlugs,
  stepSlug,
  steps,
}: StepGateInput) {
  const targetIndex = stepSlugs.indexOf(stepSlug);
  if (targetIndex <= 0) return undefined;
  return stepSlugs
    .slice(0, targetIndex)
    .find((slug) => steps[stepKey(tutorialSlug, slug)] !== "complete");
}

export function canVisitGatedStep(input: StepGateInput) {
  if (!input.stepSlugs.includes(input.stepSlug)) return true;
  return !firstIncompletePrerequisite(input);
}

export function lockedStepSlugs({ tutorialSlug, stepSlugs, steps }: GatingInput) {
  const firstIncomplete = firstIncompleteStep({ tutorialSlug, stepSlugs, steps });
  if (!firstIncomplete) return [];
  const lockStart = stepSlugs.indexOf(firstIncomplete) + 1;
  return stepSlugs.slice(lockStart);
}
