export type TutorialDifficulty = "beginner" | "intermediate" | "advanced";

export interface TutorialSummaryInput {
  id: string;
  data: {
    title: string;
    description: string;
    difficulty: TutorialDifficulty;
    estimatedDuration?: string;
  };
}

export interface TutorialSummary {
  slug: string;
  title: string;
  description: string;
  difficulty: TutorialDifficulty;
  duration?: string;
}

export function createTutorialSummary(
  tutorial: TutorialSummaryInput,
  summedDuration?: string,
): TutorialSummary {
  return {
    slug: tutorial.id,
    title: tutorial.data.title,
    description: tutorial.data.description,
    difficulty: tutorial.data.difficulty,
    duration: tutorial.data.estimatedDuration ?? summedDuration,
  };
}
