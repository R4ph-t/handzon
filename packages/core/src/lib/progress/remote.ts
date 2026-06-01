import { withBase } from "../base";
import {
  CHANNEL_NAME,
  emptyState,
  type ProgressState,
  type ProgressStore,
  STORAGE_KEY,
} from "./types";

const isBrowser = typeof window !== "undefined";

type ProgressEntry = {
  kind: string;
  scope: string;
  key: string;
  value: unknown;
  updatedAt?: string;
};

const PENDING_KEY = "handzon:pending";

function readStorage(): ProgressState {
  if (!isBrowser) return emptyState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    return { ...emptyState(), ...(JSON.parse(raw) as Partial<ProgressState>) };
  } catch {
    return emptyState();
  }
}

function writeStorage(state: ProgressState): void {
  if (!isBrowser) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function readPending(): ProgressEntry[] {
  if (!isBrowser) return [];
  try {
    return JSON.parse(window.localStorage.getItem(PENDING_KEY) ?? "[]") as ProgressEntry[];
  } catch {
    return [];
  }
}

function writePending(entries: ProgressEntry[]): void {
  window.localStorage.setItem(PENDING_KEY, JSON.stringify(entries));
}

function diffState(prev: ProgressState, next: ProgressState): ProgressEntry[] {
  const out: ProgressEntry[] = [];
  for (const [key, value] of Object.entries(next.steps)) {
    if (prev.steps[key as `${string}/${string}`] !== value) {
      const [scope, k] = key.split("/") as [string, string];
      out.push({ kind: "step", scope, key: k, value });
    }
  }
  for (const [id, value] of Object.entries(next.quizzes)) {
    if (JSON.stringify(prev.quizzes[id]) !== JSON.stringify(value)) {
      out.push({ kind: "quiz", scope: "global", key: id, value });
    }
  }
  for (const [id, value] of Object.entries(next.checkpoints)) {
    if (!prev.checkpoints[id]) {
      out.push({ kind: "checkpoint", scope: "global", key: id, value });
    }
  }
  // Emit deletions so the server tombstones unchecked checkpoints; without
  // this the next snapshot fetch would resurrect them from the DB.
  for (const id of Object.keys(prev.checkpoints)) {
    if (!next.checkpoints[id]) {
      out.push({ kind: "checkpoint", scope: "global", key: id, value: null });
      // Family D: drop the matching kind:"verification" telemetry
      // row so a re-attempt isn't pre-poisoned by the previous
      // failure feedback. Scope comes from the feedback entry
      // populated by SSE.
      const feedback = prev.verificationFeedback[id];
      if (feedback) {
        out.push({ kind: "verification", scope: feedback.scope, key: id, value: null });
      }
    }
  }
  for (const [k, value] of Object.entries(next.prefs)) {
    if ((prev.prefs as Record<string, unknown>)[k] !== value) {
      out.push({ kind: "pref", scope: "global", key: k, value });
    }
  }
  for (const [scope, value] of Object.entries(next.lastVisited)) {
    const prevValue = prev.lastVisited[scope];
    if (!prevValue || prevValue.step !== value.step || prevValue.ts !== value.ts) {
      out.push({ kind: "lastVisited", scope, key: "step", value });
    }
  }
  for (const [scope, marker] of Object.entries(next.tutorials)) {
    const prevMarker = prev.tutorials[scope] ?? {};
    if (marker.started && prevMarker.started !== marker.started) {
      out.push({ kind: "tutorial", scope, key: "started", value: { ts: marker.started } });
    }
    if (marker.completed && prevMarker.completed !== marker.completed) {
      out.push({ kind: "tutorial", scope, key: "completed", value: { ts: marker.completed } });
    }
  }
  return out;
}

/**
 * Apply one server-side progress entry to a mutable state object.
 * Shared by the initial snapshot fetch and the SSE per-event path.
 * Mutates in place — callers replace the store atom after batching.
 */
function applyEntryInto(state: ProgressState, e: ProgressEntry): void {
  if (e.kind === "step") {
    state.steps[`${e.scope}/${e.key}` as `${string}/${string}`] = e.value as
      | "incomplete"
      | "complete";
  } else if (e.kind === "quiz") {
    state.quizzes[e.key] = e.value as ProgressState["quizzes"][string];
  } else if (e.kind === "checkpoint") {
    if (e.value == null) {
      delete state.checkpoints[e.key];
      return;
    }
    state.checkpoints[e.key] = e.value as ProgressState["checkpoints"][string];
  } else if (e.kind === "pref") {
    (state.prefs as Record<string, unknown>)[e.key] = e.value;
  } else if (e.kind === "lastVisited") {
    const v = e.value as unknown;
    state.lastVisited[e.scope] =
      typeof v === "string" ? { step: v, ts: 0 } : (v as { step: string; ts: number });
  } else if (e.kind === "tutorial") {
    const v = (e.value as { ts?: number }) ?? {};
    const marker = state.tutorials[e.scope] ?? {};
    if (e.key === "started") marker.started = v.ts;
    else if (e.key === "completed") marker.completed = v.ts;
    state.tutorials[e.scope] = marker;
  } else if (e.kind === "verification") {
    if (e.value == null) {
      delete state.verificationFeedback[e.key];
      return;
    }
    const v = e.value as {
      pass: boolean;
      failingCheckIndex?: number;
      reason?: string;
      hint?: string;
      ts?: number;
    };
    state.verificationFeedback[e.key] = {
      scope: e.scope as `${string}/${string}`,
      pass: !!v.pass,
      failingCheckIndex: v.failingCheckIndex,
      reason: v.reason,
      hint: v.hint,
      ts: v.ts ?? Date.now(),
    };
  }
}

/**
 * Same shape as the local store, but mirrors writes to /api/progress with
 * debounced batching and an offline queue.
 */
export function createRemoteStore(): ProgressStore {
  let state: ProgressState = readStorage();
  const subscribers = new Set<(s: ProgressState) => void>();
  let channel: BroadcastChannel | null = null;
  let flushTimer: ReturnType<typeof setTimeout> | null = null;

  if (isBrowser && typeof BroadcastChannel !== "undefined") {
    channel = new BroadcastChannel(CHANNEL_NAME);
    channel.addEventListener("message", (event: MessageEvent) => {
      if (event.data?.type === "set") {
        state = event.data.state as ProgressState;
        for (const fn of subscribers) fn(state);
      }
    });
  }

  async function flush() {
    flushTimer = null;
    const pending = readPending();
    if (pending.length === 0) return;
    try {
      const res = await fetch(withBase("/api/progress"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pending),
        credentials: "same-origin",
      });
      if (res.ok) writePending([]);
    } catch {
      // stay offline-queued
    }
  }

  function scheduleFlush() {
    if (flushTimer) clearTimeout(flushTimer);
    flushTimer = setTimeout(flush, 750);
  }

  if (isBrowser) {
    window.addEventListener("online", () => void flush());

    // On first mount, pull the server's snapshot and merge in.
    void (async () => {
      try {
        const res = await fetch(withBase("/api/progress"), { credentials: "same-origin" });
        if (!res.ok) return;
        const { entries } = (await res.json()) as {
          entries: Array<{ kind: string; scope: string; key: string; value: unknown }>;
        };
        const merged: ProgressState = { ...emptyState(), ...state };
        for (const e of entries) applyEntryInto(merged, e);
        state = merged;
        writeStorage(state);
        for (const fn of subscribers) fn(state);
      } catch {
        // ignore — local data still drives the UI
      }
    })();

    // Live sync: subscribe to per-learner SSE so MCP-driven writes
    // (or another tab via the cookie POST) show up immediately. The
    // standard EventSource auto-reconnects on transient drops.
    if (typeof EventSource !== "undefined") {
      try {
        const es = new EventSource(withBase("/api/progress/events"), { withCredentials: true });
        es.addEventListener("message", (ev) => {
          try {
            const entry = JSON.parse(ev.data) as ProgressEntry;
            const next: ProgressState = { ...state };
            applyEntryInto(next, entry);
            state = next;
            writeStorage(state);
            for (const fn of subscribers) fn(state);
            channel?.postMessage({ type: "set", state });
          } catch (e) {
            console.warn("[handzon] sse parse failed:", e);
          }
        });
      } catch {
        // ignore — polling-via-mount still keeps things eventually consistent
      }
    }
  }

  return {
    get: () => state,
    set: (updater) => {
      const prev = state;
      state = updater(state);
      writeStorage(state);
      const entries = diffState(prev, state);
      if (entries.length > 0) {
        writePending([...readPending(), ...entries]);
        scheduleFlush();
      }
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
