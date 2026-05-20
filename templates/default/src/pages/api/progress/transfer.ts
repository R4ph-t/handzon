import type { APIRoute } from "astro";
import { getDb } from "~/db/client";
import { transferCodes, learners } from "~/db/schema";
import { eq, lt, and } from "drizzle-orm";
import { getOrCreateLearner, rebindLearner } from "~/lib/auth";

export const prerender = false;

function randomCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

// POST /api/progress/transfer { action: "create" } — issue a 6-char code bound to the current learner.
// POST /api/progress/transfer { action: "redeem", code: "XYZ123" } — rebind cookie to that learner.
export const POST: APIRoute = async ({ cookies, request }) => {
  const body = (await request.json()) as { action: "create" | "redeem"; code?: string };
  const db = getDb();
  const tenMinutes = 10 * 60 * 1000;

  if (body.action === "create") {
    const learner = await getOrCreateLearner(cookies);
    const code = randomCode();
    await db.insert(transferCodes).values({
      code,
      learnerId: learner.id,
      expiresAt: new Date(Date.now() + tenMinutes),
    });
    return new Response(JSON.stringify({ code, expiresIn: tenMinutes / 1000 }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  if (body.action === "redeem") {
    if (!body.code) {
      return new Response(JSON.stringify({ error: "Missing code." }), { status: 400 });
    }
    // GC expired codes opportunistically.
    await db.delete(transferCodes).where(lt(transferCodes.expiresAt, new Date()));
    const [row] = await db
      .select()
      .from(transferCodes)
      .where(eq(transferCodes.code, body.code.toUpperCase()))
      .limit(1);
    if (!row) return new Response(JSON.stringify({ error: "Invalid or expired code." }), { status: 404 });
    const [learner] = await db.select().from(learners).where(eq(learners.id, row.learnerId)).limit(1);
    if (!learner) return new Response(JSON.stringify({ error: "Learner not found." }), { status: 404 });
    rebindLearner(cookies, learner.deviceId);
    // One-shot — drop the code on use.
    await db.delete(transferCodes).where(eq(transferCodes.code, row.code));
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ error: "Unknown action." }), { status: 400 });
};
