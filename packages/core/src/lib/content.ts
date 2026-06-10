import { type CollectionEntry, getCollection } from "astro:content";
import { isTutorialListed, isTutorialPublished } from "./publication.ts";

export type TutorialEntry = CollectionEntry<"tutorials">;
export type StepEntry = CollectionEntry<"steps">;

const STEP_PREFIX = /^(\d+)-(.+)$/;

/**
 * Parse a step's collection id ("react-todo/01-setup") into its parts.
 * Tutorial slug is the verbatim first path segment; step ordering comes
 * from the file's numeric prefix.
 */
export function parseStepId(id: string): { tutorialSlug: string; stepSlug: string; order: number } {
  const slash = id.indexOf("/");
  if (slash < 0) {
    throw new Error(`Unrecognized step id: ${id}`);
  }
  const tutorialSlug = id.slice(0, slash);
  const stepFile = id.slice(slash + 1);
  if (!tutorialSlug || !stepFile) {
    throw new Error(`Unrecognized step id: ${id}`);
  }
  const stepMatch = STEP_PREFIX.exec(stepFile);
  return {
    tutorialSlug,
    stepSlug: stepMatch?.[2] ?? stepFile,
    order: stepMatch?.[1] ? Number.parseInt(stepMatch[1], 10) : 0,
  };
}

export async function getTutorials(): Promise<TutorialEntry[]> {
  const all = await getCollection("tutorials");
  return sortTutorials(all.filter((tutorial) => isTutorialPublished(tutorial.data)));
}

export async function getListedTutorials(): Promise<TutorialEntry[]> {
  const all = await getCollection("tutorials");
  return sortTutorials(all.filter((tutorial) => isTutorialListed(tutorial.data)));
}

function sortTutorials(tutorials: TutorialEntry[]): TutorialEntry[] {
  return tutorials.sort((a, b) => {
    const ao = (a.data as { order?: number }).order ?? 0;
    const bo = (b.data as { order?: number }).order ?? 0;
    return ao - bo;
  });
}

export async function getTutorialBySlug(slug: string): Promise<TutorialEntry | undefined> {
  const all = await getCollection("tutorials");
  return all.find((t) => t.id === slug && isTutorialPublished(t.data));
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
