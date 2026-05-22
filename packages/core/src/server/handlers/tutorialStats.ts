import type { APIRoute } from "astro";
import { eq, sql } from "drizzle-orm";
import { getDb } from "../db/client.ts";
import { progressEntries } from "../db/schema.ts";
import { json } from "../http.ts";

export interface TutorialStat {
  slug: string;
  started: number;
  completed: number;
}

interface CacheEntry {
  expiresAt: number;
  payload: { stats: TutorialStat[] };
}

const CACHE_TTL_MS = 60_000;
let cache: CacheEntry | null = null;

/**
 * Returns one row per tutorial slug with cross-learner started /
 * completed counts. Tier 1 (no DATABASE_URL) returns an empty array so
 * card hydration is a no-op and the build stays static.
 *
 * Each (learner, slug, key) is a single row thanks to the composite PK
 * on `progress_entries`, so `COUNT(*)` is a unique-learner count — no
 * extra `DISTINCT` needed.
 */
export const GET: APIRoute = async () => {
  if (!process.env.DATABASE_URL) {
    return json(
      { stats: [] satisfies TutorialStat[] },
      {
        headers: { "Cache-Control": "public, max-age=60" },
      },
    );
  }
  const now = Date.now();
  if (cache && cache.expiresAt > now) {
    return json(cache.payload, {
      headers: { "Cache-Control": "public, max-age=60" },
    });
  }

  const db = getDb();
  const rows = await db
    .select({
      scope: progressEntries.scope,
      key: progressEntries.key,
      count: sql<number>`count(*)::int`.as("count"),
    })
    .from(progressEntries)
    .where(eq(progressEntries.kind, "tutorial"))
    .groupBy(progressEntries.scope, progressEntries.key);

  const bySlug = new Map<string, TutorialStat>();
  for (const r of rows) {
    const entry = bySlug.get(r.scope) ?? { slug: r.scope, started: 0, completed: 0 };
    if (r.key === "started") entry.started = Number(r.count);
    else if (r.key === "completed") entry.completed = Number(r.count);
    bySlug.set(r.scope, entry);
  }

  const payload = { stats: Array.from(bySlug.values()) };
  cache = { expiresAt: now + CACHE_TTL_MS, payload };
  return json(payload, {
    headers: { "Cache-Control": "public, max-age=60" },
  });
};
