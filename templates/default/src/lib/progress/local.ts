import { CHANNEL_NAME, STORAGE_KEY, emptyState, type ProgressState, type ProgressStore } from "./types";

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
        subscribers.forEach((fn) => fn(state));
      }
    });
  }

  if (isBrowser) {
    window.addEventListener("storage", (e) => {
      if (e.key !== STORAGE_KEY) return;
      state = readStorage();
      subscribers.forEach((fn) => fn(state));
    });
  }

  return {
    get: () => state,
    set: (updater) => {
      state = updater(state);
      writeStorage(state);
      subscribers.forEach((fn) => fn(state));
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
export function getStore(): ProgressStore {
  if (!singleton) singleton = createLocalStore();
  return singleton;
}
