import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { getStore } from "./local";
import type { ProgressState, StepKey } from "./types";

interface ProgressApi {
  state: ProgressState;
  markStepComplete: (tutorial: string, step: string) => void;
  markStepIncomplete: (tutorial: string, step: string) => void;
  recordQuiz: (questionId: string, chosen: number[], correct: boolean) => void;
  recordCheckpoint: (checkpointId: string) => void;
  removeCheckpoint: (checkpointId: string) => void;
  setPref: <K extends keyof ProgressState["prefs"]>(
    key: K,
    value: ProgressState["prefs"][K],
  ) => void;
  setLastVisited: (tutorial: string, step: string) => void;
  markTutorialStarted: (tutorial: string) => void;
  markTutorialCompleted: (tutorial: string) => void;
  toggleFavorite: (tutorial: string) => void;
  isStepComplete: (tutorial: string, step: string) => boolean;
  isFavorite: (tutorial: string) => boolean;
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
      removeCheckpoint: (checkpointId: string) =>
        store.set((s) => {
          const hadCheckpoint = !!s.checkpoints[checkpointId];
          const hadFeedback = !!s.verificationFeedback[checkpointId];
          if (!hadCheckpoint && !hadFeedback) return s;
          const nextCheckpoints = { ...s.checkpoints };
          delete nextCheckpoints[checkpointId];
          const nextFeedback = { ...s.verificationFeedback };
          delete nextFeedback[checkpointId];
          return { ...s, checkpoints: nextCheckpoints, verificationFeedback: nextFeedback };
        }),
      setPref: <K extends keyof ProgressState["prefs"]>(key: K, value: ProgressState["prefs"][K]) =>
        store.set((s) => ({ ...s, prefs: { ...s.prefs, [key]: value } })),
      setLastVisited: (tutorial: string, step: string) =>
        store.set((s) => ({
          ...s,
          lastVisited: { ...s.lastVisited, [tutorial]: { step, ts: Date.now() } },
        })),
      markTutorialStarted: (tutorial: string) =>
        store.set((s) => {
          // Idempotent: bail if we already recorded this learner's
          // "started" event so we don't spam /api/progress on every
          // navigation.
          if (s.tutorials[tutorial]?.started) return s;
          return {
            ...s,
            tutorials: {
              ...s.tutorials,
              [tutorial]: { ...s.tutorials[tutorial], started: Date.now() },
            },
          };
        }),
      markTutorialCompleted: (tutorial: string) =>
        store.set((s) => {
          if (s.tutorials[tutorial]?.completed) return s;
          return {
            ...s,
            tutorials: {
              ...s.tutorials,
              [tutorial]: { ...s.tutorials[tutorial], completed: Date.now() },
            },
          };
        }),
      toggleFavorite: (tutorial: string) =>
        store.set((s) => {
          const nextFavorites = { ...s.favorites };
          if (nextFavorites[tutorial]) {
            delete nextFavorites[tutorial];
          } else {
            nextFavorites[tutorial] = Date.now();
          }
          return { ...s, favorites: nextFavorites };
        }),
    };
  }, [store]);

  return {
    state,
    ...actions,
    isStepComplete: (tutorial, step) =>
      state.steps[`${tutorial}/${step}` as StepKey] === "complete",
    isFavorite: (tutorial) => !!state.favorites[tutorial],
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
