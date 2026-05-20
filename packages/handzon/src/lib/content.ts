import { type CollectionEntry, getCollection } from "astro:content";

export type TutorialEntry = CollectionEntry<"tutorials">;
export type StepEntry = CollectionEntry<"steps">;

const STEP_PREFIX = /^(\d+)-(.+)$/;

/**
 * Parse a step's collection id ("02-react-todo/01-setup") into its parts.
 */
export function parseStepId(id: string): { tutorialSlug: string; stepSlug: string; order: number } {
  const [tutorialDir, stepFile] = id.split("/");
  if (!tutorialDir || !stepFile) {
    throw new Error(`Unrecognized step id: ${id}`);
  }
  const tutorialMatch = STEP_PREFIX.exec(tutorialDir);
  const stepMatch = STEP_PREFIX.exec(stepFile);
  return {
    tutorialSlug: tutorialMatch?.[2] ?? tutorialDir,
    stepSlug: stepMatch?.[2] ?? stepFile,
    order: stepMatch?.[1] ? Number.parseInt(stepMatch[1], 10) : 0,
  };
}

export async function getTutorials(): Promise<TutorialEntry[]> {
  const all = await getCollection("tutorials");
  return all.sort((a, b) => (a.data.order ?? 0) - (b.data.order ?? 0));
}

export async function getTutorialBySlug(slug: string): Promise<TutorialEntry | undefined> {
  const all = await getCollection("tutorials");
  return all.find((t) => t.id === slug);
}

export async function getStepsForTutorial(slug: string): Promise<StepEntry[]> {
  const all = await getCollection("steps");
  return all
    .filter((s) => parseStepId(s.id).tutorialSlug === slug)
    .sort((a, b) => parseStepId(a.id).order - parseStepId(b.id).order);
}

export async function getStep(
  tutorialSlug: string,
  stepSlug: string,
): Promise<StepEntry | undefined> {
  const steps = await getStepsForTutorial(tutorialSlug);
  return steps.find((s) => parseStepId(s.id).stepSlug === stepSlug);
}

/**
 * "5 min" + "3 min" → "8 min". Falls back to undefined if any step is missing duration.
 */
export function sumDurations(steps: StepEntry[]): string | undefined {
  let total = 0;
  for (const step of steps) {
    const dur = step.data.duration;
    if (!dur) return undefined;
    const match = /(\d+)\s*min/i.exec(dur);
    if (!match?.[1]) return undefined;
    total += Number.parseInt(match[1], 10);
  }
  return total > 0 ? `${total} min` : undefined;
}
