import { and, desc, eq } from "drizzle-orm";
import { generatePat, hashPat } from "./auth.ts";
import { getDb } from "./db/client.ts";
import { learnerApiTokens } from "./db/schema.ts";

/** Known scopes. The MCP endpoint gates writes on progress:write;
 * catalog reads need any valid token. We keep the strings as
 * comma-joined values in DB to mirror what an OAuth 2.1 token would
 * carry in the v2 proxy.
 */
export const KNOWN_SCOPES = ["progress:read", "progress:write"] as const;
export type Scope = (typeof KNOWN_SCOPES)[number];

export interface TokenRow {
  id: string;
  name: string;
  scopes: string[];
  createdAt: Date;
  lastUsedAt: Date | null;
  expiresAt: Date | null;
}

export async function listTokens(userId: string): Promise<TokenRow[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: learnerApiTokens.id,
      name: learnerApiTokens.name,
      scopes: learnerApiTokens.scopes,
      createdAt: learnerApiTokens.createdAt,
      lastUsedAt: learnerApiTokens.lastUsedAt,
      expiresAt: learnerApiTokens.expiresAt,
    })
    .from(learnerApiTokens)
    .where(eq(learnerApiTokens.userId, userId))
    .orderBy(desc(learnerApiTokens.createdAt));
  return rows.map((r) => ({
    ...r,
    scopes: r.scopes
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  }));
}

/**
 * Mint a new PAT for the user. Returns the raw token *once* — it is
 * never stored, and there is no path to recover it. Caller is
 * responsible for showing it to the user a single time.
 */
export async function createToken(opts: {
  userId: string;
  name: string;
  scopes: Scope[];
  expiresAt?: Date | null;
}): Promise<{ id: string; raw: string }> {
  const db = getDb();
  const raw = generatePat();
  const tokenHash = await hashPat(raw);
  const [row] = await db
    .insert(learnerApiTokens)
    .values({
      userId: opts.userId,
      name: opts.name,
      tokenHash,
      scopes: opts.scopes.join(","),
      expiresAt: opts.expiresAt ?? null,
    })
    .returning({ id: learnerApiTokens.id });
  return { id: row!.id, raw };
}

export async function revokeToken(userId: string, tokenId: string): Promise<boolean> {
  const db = getDb();
  const result = await db
    .delete(learnerApiTokens)
    .where(and(eq(learnerApiTokens.userId, userId), eq(learnerApiTokens.id, tokenId)))
    .returning({ id: learnerApiTokens.id });
  return result.length > 0;
}
