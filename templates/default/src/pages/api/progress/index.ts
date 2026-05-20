import type { APIRoute } from "astro";
import { getDb } from "~/db/client";
import { progressEntries } from "~/db/schema";
import { eq } from "drizzle-orm";
import { getOrCreateLearner } from "~/lib/auth";

export const prerender = false;

export const GET: APIRoute = async ({ cookies }) => {
  const learner = await getOrCreateLearner(cookies);
  const db = getDb();
  const rows = await db
    .select()
    .from(progressEntries)
    .where(eq(progressEntries.learnerId, learner.id));
  return new Response(JSON.stringify({ entries: rows }), {
    headers: { "Content-Type": "application/json" },
  });
};

export const POST: APIRoute = async ({ cookies, request }) => {
  const learner = await getOrCreateLearner(cookies);
  const body = (await request.json()) as Array<{
    kind: string;
    scope: string;
    key: string;
    value: unknown;
  }>;
  if (!Array.isArray(body) || body.length === 0) {
    return new Response(JSON.stringify({ written: 0 }), {
      headers: { "Content-Type": "application/json" },
    });
  }
  const db = getDb();
  const rows = body.map((b) => ({
    learnerId: learner.id,
    kind: b.kind,
    scope: b.scope,
    key: b.key,
    value: b.value,
    updatedAt: new Date(),
  }));
  await db
    .insert(progressEntries)
    .values(rows)
    .onConflictDoUpdate({
      target: [progressEntries.learnerId, progressEntries.kind, progressEntries.scope, progressEntries.key],
      set: { value: progressEntries.value, updatedAt: new Date() },
    });
  return new Response(JSON.stringify({ written: rows.length }), {
    headers: { "Content-Type": "application/json" },
  });
};
