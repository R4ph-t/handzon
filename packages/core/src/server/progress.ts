import { and, eq, sql } from "drizzle-orm";
import { getDb } from "./db/client.ts";
import { progressEntries } from "./db/schema.ts";

export type ProgressKind =
  | "step"
  | "checkpoint"
  | "quiz"
  | "pref"
  | "lastVisited"
  | "tutorial"
  | "verification";

export interface ProgressEntryWrite {
  kind: ProgressKind;
  scope: string;
  key: string;
  /** Use `null` to delete the row (the tombstone signal). */
  value: unknown;
}

/**
 * Shared writer used by both the cookie-authed POST /api/progress
 * handler and the bearer-authed MCP write tools. Splits entries into
 * deletes (value === null) and upserts, then runs them with the same
 * UPSERT semantics the API handler uses.
 *
 * Returns the count of rows written/deleted so the caller can echo a
 * sensible response back.
 */
export async function writeProgressEntries(
  learnerId: string,
  entries: ProgressEntryWrite[],
): Promise<number> {
  if (entries.length === 0) return 0;
  const db = getDb();
  const now = new Date();
  const deletes = entries.filter((e) => e.value === null);
  const upserts = entries.filter((e) => e.value !== null);

  for (const d of deletes) {
    await db
      .delete(progressEntries)
      .where(
        and(
          eq(progressEntries.learnerId, learnerId),
          eq(progressEntries.kind, d.kind),
          eq(progressEntries.scope, d.scope),
          eq(progressEntries.key, d.key),
        ),
      );
  }

  if (upserts.length > 0) {
    const rows = upserts.map((b) => ({
      learnerId,
      kind: b.kind,
      scope: b.scope,
      key: b.key,
      value: b.value,
      updatedAt: now,
    }));
    await db
      .insert(progressEntries)
      .values(rows)
      .onConflictDoUpdate({
        target: [
          progressEntries.learnerId,
          progressEntries.kind,
          progressEntries.scope,
          progressEntries.key,
        ],
        set: {
          value: sql`excluded.value`,
          updatedAt: sql`excluded.updated_at`,
        },
      });
  }

  return entries.length;
}
