import { createRemoteStore } from "./remote";
import {
  CHANNEL_NAME,
  emptyState,
  type ProgressState,
  type ProgressStore,
  STORAGE_KEY,
} from "./types";

const isBrowser = typeof window !== "undefined";

function readStorage(): ProgressState {
  if (!isBrowser) return emptyState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as Partial<ProgressState>;
    return { ...emptyState(), ...parsed };
  } catch {
    return emptyState();
  }
}

function writeStorage(state: ProgressState): void {
  if (!isBrowser) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // quota or private mode — silently swallow
  }
}

export function createLocalStore(): ProgressStore {
  let state: ProgressState = readStorage();
  const subscribers = new Set<(s: ProgressState) => void>();
  let channel: BroadcastChannel | null = null;

  if (isBrowser && typeof BroadcastChannel !== "undefined") {
    channel = new BroadcastChannel(CHANNEL_NAME);
    channel.addEventListener("message", (event: MessageEvent) => {
      if (event.data?.type === "set") {
        state = event.data.state as ProgressState;
        for (const fn of subscribers) fn(state);
      }
    });
  }

  if (isBrowser) {
    window.addEventListener("storage", (e) => {
      if (e.key !== STORAGE_KEY) return;
      state = readStorage();
      for (const fn of subscribers) fn(state);
    });
  }

  return {
    get: () => state,
    set: (updater) => {
      state = updater(state);
      writeStorage(state);
      for (const fn of subscribers) fn(state);
      channel?.postMessage({ type: "set", state });
    },
    subscribe: (fn) => {
      subscribers.add(fn);
      return () => {
        subscribers.delete(fn);
      };
    },
  };
}

let singleton: ProgressStore | null = null;

/**
 * Pick the right store based on PUBLIC_PROGRESS_BACKEND. Both stores
 * are statically imported because dynamic `require()` doesn't exist in
 * the browser ESM bundle (this file ships to the client) and a dynamic
 * `import()` would force every call site to become async.
 */
export function getStore(): ProgressStore {
  if (singleton) return singleton;
  if (isBrowser && import.meta.env.PUBLIC_PROGRESS_BACKEND === "remote") {
    singleton = createRemoteStore();
  } else {
    singleton = createLocalStore();
  }
  return singleton;
}
