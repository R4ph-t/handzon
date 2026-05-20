/**
 * Static-path helpers for handzon scaffolds. Use these as the
 * `getStaticPaths` export of a route file:
 *
 *   export const getStaticPaths = getTutorialLandingPaths;
 *   export const getStaticPaths = getTutorialStepPaths;
 */
import { getStepsForTutorial, getTutorials, parseStepId } from "../lib/content.ts";
import type { StepEntry, TutorialEntry } from "../lib/content.ts";

export async function getTutorialLandingPaths() {
  const tutorials = await getTutorials();
  return tutorials.map((tut) => ({
    params: { tutorial: tut.id },
    props: { tutorial: tut },
  }));
}

export async function getTutorialStepPaths() {
  const tutorials = await getTutorials();
  const paths: Array<{
    params: { tutorial: string; step: string };
    props: { tutorial: TutorialEntry; steps: StepEntry[]; currentStep: StepEntry };
  }> = [];
  for (const tut of tutorials) {
    const steps = await getStepsForTutorial(tut.id);
    for (const step of steps) {
      const { stepSlug } = parseStepId(step.id);
      paths.push({
        params: { tutorial: tut.id, step: stepSlug },
        props: { tutorial: tut, steps, currentStep: step },
      });
    }
  }
  return paths;
}
