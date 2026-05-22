import type { APIRoute } from "astro";
import { getOrCreateLearner } from "../auth.ts";
import { isSameOrigin } from "../http.ts";
import { subscribeLearner } from "../progressBus.ts";

const HEARTBEAT_MS = 25_000;

/**
 * Server-Sent Events stream of progress writes for the current
 * learner. One connection per open browser tab; the in-app store
 * (`createRemoteStore`) opens an EventSource on first mount and
 * merges incoming entries through the same reducer as the
 * POST-response path.
 *
 * Each event has the shape:
 *   data: { "kind": "...", "scope": "...", "key": "...", "value": ..., "ts": ... }
 *
 * Heartbeat comments keep proxies (CDN, Render's edge) from
 * killing the connection on idle.
 */
export const GET: APIRoute = async ({ cookies, request }) => {
  if (!process.env.DATABASE_URL) {
    return new Response("SSE disabled — no DATABASE_URL.", { status: 503 });
  }
  if (!isSameOrigin(request)) {
    return new Response("Cross-origin SSE rejected.", { status: 403 });
  }
  const learner = await getOrCreateLearner(cookies, request);
  const encoder = new TextEncoder();
  let unsubscribe: (() => void) | null = null;
  let heartbeat: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      // Initial connect comment — clients show "open" only after a
      // first bit of data, and some proxies need a flush.
      controller.enqueue(encoder.encode(": connected\n\n"));
      unsubscribe = subscribeLearner(learner.id, (msg) => {
        try {
          const payload = JSON.stringify(msg);
          controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
        } catch (e) {
          console.warn("[handzon] sse encode failed:", e);
        }
      });
      heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": keepalive\n\n"));
        } catch {
          /* controller closed — cancel will clean up */
        }
      }, HEARTBEAT_MS);
    },
    cancel() {
      unsubscribe?.();
      if (heartbeat) clearInterval(heartbeat);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
};
