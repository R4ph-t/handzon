import { and, eq } from "drizzle-orm";
import { resolveActiveTrack, type TrackOption } from "../../lib/tracks.ts";
import { getDb } from "../db/client.ts";
import { progressEntries } from "../db/schema.ts";

export async function readPersistedTrack(
  learnerId: string | undefined,
): Promise<string | undefined> {
  if (!learnerId) return undefined;
  const db = getDb();
  const [row] = await db
    .select({ value: progressEntries.value })
    .from(progressEntries)
    .where(
      and(
        eq(progressEntries.learnerId, learnerId),
        eq(progressEntries.kind, "pref"),
        eq(progressEntries.scope, "global"),
        eq(progressEntries.key, "track"),
      ),
    )
    .limit(1);
  return typeof row?.value === "string" ? row.value : undefined;
}

export async function resolveMcpTrack({
  tracks,
  defaultTrack,
  explicitTrack,
  learnerId,
}: {
  tracks?: TrackOption[];
  defaultTrack?: string;
  explicitTrack?: string;
  learnerId?: string;
}): Promise<string | undefined> {
  return resolveActiveTrack({
    tracks,
    explicitTrack,
    preferredTrack: await readPersistedTrack(learnerId),
    defaultTrack,
  });
}
