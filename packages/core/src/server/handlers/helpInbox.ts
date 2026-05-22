import type { APIRoute } from "astro";
import { and, eq, isNull } from "drizzle-orm";
import { getOrCreateLearner } from "../auth.ts";
import { getDb } from "../db/client.ts";
import { helpRequests } from "../db/schema.ts";
import { isSameOrigin, json } from "../http.ts";

/**
 * Returns the learner's pending help-request inbox (rows where
 * consumed_at IS NULL) and stamps them as consumed in one
 * round-trip. ChatPanel calls this when it opens; the response
 * becomes the seed user turns that get auto-streamed.
 *
 * Same-origin guarded — only the in-browser ChatPanel reads the
 * inbox. The MCP-side `request_help` tool produces rows; this
 * endpoint consumes them.
 */
export const GET: APIRoute = async ({ cookies, request }) => {
  if (!process.env.DATABASE_URL) return json({ requests: [] });
  if (!isSameOrigin(request)) {
    return json({ error: "Cross-origin read rejected." }, { status: 403 });
  }
  const learner = await getOrCreateLearner(cookies, request);
  const db = getDb();
  const rows = await db
    .select()
    .from(helpRequests)
    .where(and(eq(helpRequests.learnerId, learner.id), isNull(helpRequests.consumedAt)));
  if (rows.length > 0) {
    const now = new Date();
    await db
      .update(helpRequests)
      .set({ consumedAt: now })
      .where(and(eq(helpRequests.learnerId, learner.id), isNull(helpRequests.consumedAt)));
  }
  return json({
    requests: rows.map((r) => ({
      id: r.id,
      tutorialSlug: r.tutorialSlug,
      stepSlug: r.stepSlug,
      query: r.query,
      createdAt: r.createdAt.toISOString(),
    })),
  });
};
