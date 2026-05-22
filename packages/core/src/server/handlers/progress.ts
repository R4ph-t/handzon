import type { APIRoute } from "astro";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getOrCreateLearner } from "../auth.ts";
import { getDb } from "../db/client.ts";
import { progressEntries } from "../db/schema.ts";
import { isSameOrigin, json } from "../http.ts";
import { writeProgressEntries } from "../progress.ts";

const MAX_BODY_BYTES = 32 * 1024;
const MAX_ENTRIES = 200;

const ProgressEntrySchema = z.object({
  kind: z.enum(["step", "checkpoint", "quiz", "pref", "lastVisited", "tutorial"]),
  scope: z.string().min(1).max(128),
  key: z.string().min(1).max(128),
  value: z.unknown(),
});

const ProgressBodySchema = z.array(ProgressEntrySchema).max(MAX_ENTRIES);

// Tier 1: no Postgres — returns an empty list (the frontend uses the
// local store and never reads this in that mode). Tier 2: hits Postgres.
export const GET: APIRoute = async ({ cookies, request }) => {
  if (!process.env.DATABASE_URL) {
    return json({ entries: [] });
  }
  const learner = await getOrCreateLearner(cookies, request);
  const db = getDb();
  const rows = await db
    .select()
    .from(progressEntries)
    .where(eq(progressEntries.learnerId, learner.id));
  return json({ entries: rows });
};

export const POST: APIRoute = async ({ cookies, request }) => {
  if (!isSameOrigin(request)) {
    return json({ error: "Cross-origin write rejected." }, { status: 403 });
  }
  if (!process.env.DATABASE_URL) {
    return json({ written: 0 });
  }

  const lengthHeader = request.headers.get("content-length");
  if (lengthHeader && Number(lengthHeader) > MAX_BODY_BYTES) {
    return json({ error: "Payload too large." }, { status: 413 });
  }
  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    return json({ error: "Payload too large." }, { status: 413 });
  }

  let parsed: z.infer<typeof ProgressBodySchema>;
  try {
    parsed = ProgressBodySchema.parse(JSON.parse(raw));
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Invalid JSON." }, { status: 400 });
  }
  if (parsed.length === 0) return json({ written: 0 });

  const learner = await getOrCreateLearner(cookies, request);
  // `value: null` is the tombstone signal for "this entry was undone"
  // (e.g. unchecking a checkpoint). writeProgressEntries handles the
  // split into deletes + upserts; the same writer is used by the MCP
  // write tools so behaviour stays consistent across surfaces.
  const written = await writeProgressEntries(learner.id, parsed);
  return json({ written });
};
