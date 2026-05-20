import type { AstroCookies } from "astro";
import { eq } from "drizzle-orm";
import { getDb } from "~/db/client";
import { learners } from "~/db/schema";

const COOKIE = "tt-device";
const ONE_YEAR = 60 * 60 * 24 * 365;

function randomDeviceId(): string {
  // 22-char URL-safe random id
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
  cookies.set(COOKIE, deviceId, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: ONE_YEAR,
  });
  return { id: created!.id, deviceId };
}

export function rebindLearner(cookies: AstroCookies, deviceId: string): void {
  cookies.set(COOKIE, deviceId, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: ONE_YEAR,
  });
}
