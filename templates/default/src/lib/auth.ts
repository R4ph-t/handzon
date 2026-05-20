import type { AstroCookieSetOptions, AstroCookies } from "astro";
import { eq } from "drizzle-orm";
import { getDb } from "~/db/client";
import { learners } from "~/db/schema";

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

export async function getOrCreateLearner(
  cookies: AstroCookies,
): Promise<{ id: string; deviceId: string }> {
  const db = getDb();
  let deviceId = cookies.get(COOKIE)?.value;
  if (deviceId) {
    const found = await db.select().from(learners).where(eq(learners.deviceId, deviceId)).limit(1);
    if (found[0]) return { id: found[0].id, deviceId };
  }
  deviceId = randomDeviceId();
  const [created] = await db.insert(learners).values({ deviceId }).returning();
  cookies.set(COOKIE, deviceId, COOKIE_OPTS);
  return { id: created!.id, deviceId };
}
