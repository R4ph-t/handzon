import type { AstroCookieSetOptions, AstroCookies } from "astro";
import { and, eq, isNull } from "drizzle-orm";
import { getAuthedUser } from "./auth/session.ts";
import { getDb } from "./db/client.ts";
import { learners, progressEntries } from "./db/schema.ts";

const COOKIE = "tt-device";
const ONE_YEAR = 60 * 60 * 24 * 365;

const COOKIE_OPTS: AstroCookieSetOptions = {
  httpOnly: true,
  // Only flip on `secure` in production — Astro's dev server is plain
  // HTTP and `secure: true` silently drops the cookie there.
  secure: import.meta.env.PROD,
  sameSite: "lax",
  path: "/",
  maxAge: ONE_YEAR,
};

function randomDeviceId(): string {
  // 32-char hex (128 bits) — plenty for an unpredictable, opaque id.
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Resolve the current learner row.
 *
 * - No session + no cookie → mint a device learner + cookie (anonymous).
 * - No session + cookie    → return the existing device learner.
 * - Session present        → return the user-linked learner. If a device
 *                            cookie also exists and points to an orphan
 *                            (user_id NULL), re-key its progress to the
 *                            user learner in a single transaction and
 *                            drop the device cookie. One-time claim.
 *
 * `request` is required so we can read the Auth.js session. Endpoints
 * that don't currently have it (older internal callers) can pass `null`
 * to keep the anonymous-only path.
 */
export async function getOrCreateLearner(
  cookies: AstroCookies,
  request: Request | null,
): Promise<{ id: string; deviceId: string | null }> {
  const db = getDb();
  const authed = request ? await getAuthedUser(request) : null;

  if (authed) {
    const userLearner = await findOrCreateUserLearner(db, authed.userId);
    const deviceId = cookies.get(COOKIE)?.value;
    if (deviceId) {
      await maybeClaimDeviceProgress(db, deviceId, userLearner.id);
      cookies.delete(COOKIE, { path: "/" });
    }
    return { id: userLearner.id, deviceId: null };
  }

  // Anonymous path — unchanged from pre-auth behaviour.
  let deviceId = cookies.get(COOKIE)?.value;
  if (deviceId) {
    const found = await db
      .select()
      .from(learners)
      .where(eq(learners.deviceId, deviceId))
      .limit(1);
    if (found[0]) return { id: found[0].id, deviceId };
  }
  deviceId = randomDeviceId();
  const [created] = await db.insert(learners).values({ deviceId }).returning();
  cookies.set(COOKIE, deviceId, COOKIE_OPTS);
  return { id: created!.id, deviceId };
}

async function findOrCreateUserLearner(
  db: ReturnType<typeof getDb>,
  userId: string,
): Promise<{ id: string }> {
  const existing = await db
    .select({ id: learners.id })
    .from(learners)
    .where(eq(learners.userId, userId))
    .limit(1);
  if (existing[0]) return { id: existing[0].id };
  const [created] = await db.insert(learners).values({ userId }).returning({ id: learners.id });
  return { id: created!.id };
}

/**
 * If `deviceId` points at an orphan (user_id NULL) learner with progress,
 * re-parent its progress rows to `userLearnerId` and delete the orphan.
 * Idempotent: subsequent sign-ins with the same device cookie no-op.
 */
async function maybeClaimDeviceProgress(
  db: ReturnType<typeof getDb>,
  deviceId: string,
  userLearnerId: string,
): Promise<void> {
  const orphans = await db
    .select({ id: learners.id })
    .from(learners)
    .where(and(eq(learners.deviceId, deviceId), isNull(learners.userId)))
    .limit(1);
  const orphan = orphans[0];
  if (!orphan || orphan.id === userLearnerId) return;

  await db.transaction(async (tx) => {
    // Move progress rows. ON CONFLICT: keep the row with the most
    // recent updated_at — if the user already has progress on this
    // (kind, scope, key), prefer whichever was touched last.
    await tx.execute(/* sql */ `
      INSERT INTO "progress_entries" ("learner_id","kind","scope","key","value","updated_at")
      SELECT '${userLearnerId}'::uuid, "kind","scope","key","value","updated_at"
      FROM "progress_entries"
      WHERE "learner_id" = '${orphan.id}'::uuid
      ON CONFLICT ("learner_id","kind","scope","key")
      DO UPDATE SET
        "value" = CASE WHEN EXCLUDED."updated_at" > "progress_entries"."updated_at"
                       THEN EXCLUDED."value" ELSE "progress_entries"."value" END,
        "updated_at" = GREATEST(EXCLUDED."updated_at", "progress_entries"."updated_at");
    `);
    await tx.delete(progressEntries).where(eq(progressEntries.learnerId, orphan.id));
    await tx.delete(learners).where(eq(learners.id, orphan.id));
  });
}
