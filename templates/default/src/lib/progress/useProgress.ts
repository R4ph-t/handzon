import { useEffect, useState, useSyncExternalStore } from "react";
import { getStore } from "./local";
import type { ProgressState, StepKey } from "./types";

export function useProgress(): {
  state: ProgressState;
  markStepComplete: (tutorial: string, step: string) => void;
  markStepIncomplete: (tutorial: string, step: string) => void;
  recordQuiz: (questionId: string, chosen: number[], correct: boolean) => void;
  recordCheckpoint: (checkpointId: string) => void;
  setPref: <K extends keyof ProgressState["prefs"]>(
    key: K,
    value: ProgressState["prefs"][K],
  ) => void;
  setLastVisited: (tutorial: string, step: string) => void;
  isStepComplete: (tutorial: string, step: string) => boolean;
} {
  const store = getStore();
  const state = useSyncExternalStore(
    store.subscribe,
    () => store.get(),
    () => store.get(),
  );

  const stepKey = (tutorial: string, step: string): StepKey => `${tutorial}/${step}`;

  return {
    state,
    markStepComplete: (tutorial, step) =>
      store.set((s) => ({ ...s, steps: { ...s.steps, [stepKey(tutorial, step)]: "complete" } })),
    markStepIncomplete: (tutorial, step) =>
      store.set((s) => ({ ...s, steps: { ...s.steps, [stepKey(tutorial, step)]: "incomplete" } })),
    recordQuiz: (questionId, chosen, correct) =>
      store.set((s) => ({
        ...s,
        quizzes: { ...s.quizzes, [questionId]: { chosen, correct, ts: Date.now() } },
      })),
    recordCheckpoint: (checkpointId) =>
      store.set((s) => ({
        ...s,
        checkpoints: { ...s.checkpoints, [checkpointId]: { ts: Date.now() } },
      })),
    setPref: (key, value) => store.set((s) => ({ ...s, prefs: { ...s.prefs, [key]: value } })),
    setLastVisited: (tutorial, step) =>
      store.set((s) => ({ ...s, lastVisited: { ...s.lastVisited, [tutorial]: step } })),
    isStepComplete: (tutorial, step) => state.steps[stepKey(tutorial, step)] === "complete",
  };
}

/**
 * SSR-safe variant that only reads the store after mount. Use this when a
 * component needs to render something only when the value is known (e.g.
 * "Resume" buttons that should not flash on first paint).
 */
export function useProgressAfterMount(): ProgressState | null {
  const [mounted, setMounted] = useState(false);
  const store = getStore();
  const state = useSyncExternalStore(
    store.subscribe,
    () => store.get(),
    () => store.get(),
  );
  useEffect(() => setMounted(true), []);
  return mounted ? state : null;
}
