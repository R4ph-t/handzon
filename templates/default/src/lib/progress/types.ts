export type StepKey = `${string}/${string}`;

export type ProgressState = {
  steps: Record<StepKey, "incomplete" | "complete">;
  quizzes: Record<string, { chosen: number[]; correct: boolean; ts: number }>;
  checkpoints: Record<string, { ts: number }>;
  prefs: {
    packageManager?: "npm" | "pnpm" | "yarn" | "bun";
    os?: "macos" | "linux" | "windows";
    theme?: "light" | "dark";
  };
  lastVisited: Record<string, string>;
};

export interface ProgressStore {
  get(): ProgressState;
  set(updater: (s: ProgressState) => ProgressState): void;
  subscribe(fn: (s: ProgressState) => void): () => void;
}

export const emptyState = (): ProgressState => ({
  steps: {},
  quizzes: {},
  checkpoints: {},
  prefs: {},
  lastVisited: {},
});

export const STORAGE_KEY = "tutorial-tool:v1";
export const CHANNEL_NAME = "tutorial-tool:v1";
