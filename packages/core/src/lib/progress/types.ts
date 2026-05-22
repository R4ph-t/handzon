export type StepKey = `${string}/${string}`;

export interface LastVisitedEntry {
  step: string;
  ts: number;
}

/**
 * Local mirror of the per-learner "I started / finished this tutorial"
 * markers. We keep them locally so the remote diff is idempotent (no
 * duplicate POSTs when the user reloads). The server's composite PK
 * makes re-sends harmless but spamming `/api/progress` is rude.
 */
export interface TutorialMarker {
  started?: number;
  completed?: number;
}

/**
 * Family D verification feedback delivered via SSE from
 * `submit_verification` failures. Keyed by the checkpoint id (which
 * equals `verify.id`). Carries the step scope so the diff can emit
 * a tombstone with the right scope when the learner unchecks.
 */
export interface VerificationFeedbackEntry {
  scope: StepKey;
  pass: boolean;
  failingCheckIndex?: number;
  reason?: string;
  hint?: string;
  ts: number;
}

export type ProgressState = {
  steps: Record<StepKey, "incomplete" | "complete">;
  quizzes: Record<string, { chosen: number[]; correct: boolean; ts: number }>;
  checkpoints: Record<string, { ts: number }>;
  /**
   * Latest verification verdict per checkpoint id. `pass: true`
   * entries hang around as evidence; the Family D UI only renders
   * the inline hint block on `pass: false`. Cleared when the
   * learner unchecks the matching checkpoint.
   */
  verificationFeedback: Record<string, VerificationFeedbackEntry>;
  prefs: {
    packageManager?: "npm" | "pnpm" | "yarn" | "bun";
    os?: "macos" | "linux" | "windows";
    theme?: "light" | "dark";
  };
  /**
   * Per-tutorial "where was I last?" marker. Tracks `ts` so consumers
   * (like the ResumeRail) can pick the truly most-recent tutorial
   * instead of relying on insertion order, which lies when an existing
   * key is overwritten.
   */
  lastVisited: Record<string, LastVisitedEntry>;
  /**
   * Per-tutorial popularity-event markers. Cross-learner aggregates
   * live on the server (`/api/tutorials/stats`); this map only tracks
   * what *this* learner has emitted so we can dedupe.
   */
  tutorials: Record<string, TutorialMarker>;
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
  verificationFeedback: {},
  prefs: {},
  lastVisited: {},
  tutorials: {},
});

// TODO: when you change ProgressState's shape in a way that's not
// forward-compatible with the spread-merge in readStorage(), bump the
// version suffix and add a one-shot migration in `local.ts` that reads
// the old key, transforms it, and writes the new one.
export const STORAGE_KEY = "handzon:v1";
export const CHANNEL_NAME = "handzon:v1";
