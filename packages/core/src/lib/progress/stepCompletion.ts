import type { ProgressState } from "./types";

export interface StepCompletionItems {
  quizIds: string[];
  checkpointIds: string[];
}

export type DerivedStepCompletion = "complete" | "incomplete" | null;

export function deriveStepCompletion(
  state: ProgressState,
  { quizIds, checkpointIds }: StepCompletionItems,
): DerivedStepCompletion {
  if (quizIds.length === 0 && checkpointIds.length === 0) return null;

  const allQuizzesCorrect = quizIds.every((id) => state.quizzes[id]?.correct === true);
  const allCheckpointsDone = checkpointIds.every((id) => !!state.checkpoints[id]);

  return allQuizzesCorrect && allCheckpointsDone ? "complete" : "incomplete";
}
