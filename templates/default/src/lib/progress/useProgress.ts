import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { getStore } from "./local";
import type { ProgressState, StepKey } from "./types";

interface ProgressApi {
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
}

/**
 * Action methods are memoized in a useMemo with an empty dep list so their
 * references stay stable across renders. Without this, every render produced
 * a new `markStepComplete` (etc.) reference; consumers using these as effect
 * deps would re-run effects forever, each call triggering a store update and
 * another render — a freeze-the-tab render storm.
 */
export function useProgress(): ProgressApi {
  const store = getStore();
  const state = useSyncExternalStore(
    store.subscribe,
    () => store.get(),
    () => store.get(),
  );

  const actions = useMemo(() => {
    const stepKey = (tutorial: string, step: string): StepKey => `${tutorial}/${step}`;
    return {
      markStepComplete: (tutorial: string, step: string) =>
        store.set((s) => ({
          ...s,
          steps: { ...s.steps, [stepKey(tutorial, step)]: "complete" as const },
        })),
      markStepIncomplete: (tutorial: string, step: string) =>
        store.set((s) => ({
          ...s,
          steps: { ...s.steps, [stepKey(tutorial, step)]: "incomplete" as const },
        })),
      recordQuiz: (questionId: string, chosen: number[], correct: boolean) =>
        store.set((s) => ({
          ...s,
          quizzes: { ...s.quizzes, [questionId]: { chosen, correct, ts: Date.now() } },
        })),
      recordCheckpoint: (checkpointId: string) =>
        store.set((s) => ({
          ...s,
          checkpoints: { ...s.checkpoints, [checkpointId]: { ts: Date.now() } },
        })),
      setPref: <K extends keyof ProgressState["prefs"]>(key: K, value: ProgressState["prefs"][K]) =>
        store.set((s) => ({ ...s, prefs: { ...s.prefs, [key]: value } })),
      setLastVisited: (tutorial: string, step: string) =>
        store.set((s) => ({
          ...s,
          lastVisited: { ...s.lastVisited, [tutorial]: { step, ts: Date.now() } },
        })),
    };
  }, [store]);

  return {
    state,
    ...actions,
    isStepComplete: (tutorial, step) =>
      state.steps[`${tutorial}/${step}` as StepKey] === "complete",
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
