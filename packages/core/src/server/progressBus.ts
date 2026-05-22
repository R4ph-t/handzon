import type { ProgressEntryWrite } from "./progress.ts";

/**
 * Process-local pub/sub for progress writes. Both the cookie-authed
 * POST /api/progress handler and the MCP write tools call publish()
 * after persisting; the SSE endpoint subscribes per learner so the
 * open browser tab sees MCP-driven writes within one event-loop
 * tick.
 *
 * Multi-instance caveat: on a horizontally-scaled deploy, a write
 * landing on instance A is invisible to a subscriber on instance B.
 * v1 is single-instance; v2 swaps this for Postgres LISTEN/NOTIFY on
 * a "learner_<uuid>" channel (Postgres is already in the stack).
 */

export interface ProgressBusMessage extends ProgressEntryWrite {
  ts: number;
}

type Listener = (msg: ProgressBusMessage) => void;

const channels = new Map<string, Set<Listener>>();

export function subscribeLearner(learnerId: string, listener: Listener): () => void {
  let set = channels.get(learnerId);
  if (!set) {
    set = new Set();
    channels.set(learnerId, set);
  }
  set.add(listener);
  return () => {
    set?.delete(listener);
    if (set && set.size === 0) channels.delete(learnerId);
  };
}

export function publishLearner(learnerId: string, entries: ProgressEntryWrite[]): void {
  const subs = channels.get(learnerId);
  if (!subs || subs.size === 0) return;
  const ts = Date.now();
  for (const entry of entries) {
    const msg: ProgressBusMessage = { ...entry, ts };
    for (const fn of subs) {
      try {
        fn(msg);
      } catch (e) {
        console.warn("[handzon] progress bus listener threw:", e);
      }
    }
  }
}
