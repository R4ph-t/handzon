/**
 * Auth.js config factory consumed by the scaffold's `auth.config.ts`.
 *
 * Usage (scaffold side):
 *
 *   import { createAuthConfig } from "handzon-core/server/auth/config";
 *   import { getDb } from "handzon-core/server/db/client";
 *   export default createAuthConfig({ db: getDb() });
 *
 * GitHub is the only provider in 0.2; email/password and others are
 * out of scope (see plan: github-auth_d52529d5).
 */

import GitHub from "@auth/core/providers/github";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { defineConfig } from "auth-astro";
import { accounts, sessions, users, verificationTokens } from "./schema.ts";

interface AuthConfigOptions {
  /**
   * Postgres drizzle client, or `null` when DATABASE_URL isn't
   * available at build time. When `null`, we return a stub config so
   * auth-astro's integration loads but does nothing — useful for Tier 1
   * builds and for `pnpm build` on a fresh checkout without a database.
   */
  db: Parameters<typeof DrizzleAdapter>[0] | null;
}

/**
 * Normalises whatever the operator gave us into a full URL that
 * Auth.js + GitHub OAuth callbacks can use. Priority:
 *
 *   1. `AUTH_URL`              — operator override; supports either a
 *                                full URL or a bare hostname (in which
 *                                case we append `.onrender.com`, the
 *                                same shape used by ALLOWED_ORIGIN and
 *                                PUBLIC_AI_SERVICE_URL).
 *   2. `RENDER_EXTERNAL_URL`   — Render auto-injects this on every web
 *                                service (e.g. `https://foo.onrender.com`).
 *   3. `RENDER_EXTERNAL_HOSTNAME` — bare hostname, also auto-injected;
 *                                we prefix with `https://`.
 *
 * Returns `undefined` when none are set (local dev with no override —
 * Auth.js falls back to the request's Origin header).
 */
function resolveAuthUrl(): string | undefined {
  const explicit = process.env.AUTH_URL?.trim();
  if (explicit) {
    const trimmed = explicit.replace(/\/$/, "");
    return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}.onrender.com`;
  }
  const renderUrl = process.env.RENDER_EXTERNAL_URL?.trim();
  if (renderUrl) return renderUrl.replace(/\/$/, "");
  const renderHost = process.env.RENDER_EXTERNAL_HOSTNAME?.trim();
  if (renderHost) return `https://${renderHost}`;
  return undefined;
}

export function createAuthConfig({ db }: AuthConfigOptions) {
  // Auth.js v5 reads `AUTH_URL` from process.env on each request, so
  // we resolve once and write it back. Idempotent: if AUTH_URL was
  // already a full URL, this is a no-op aside from the trailing-slash
  // trim.
  const resolvedUrl = resolveAuthUrl();
  if (resolvedUrl && resolvedUrl !== process.env.AUTH_URL) {
    process.env.AUTH_URL = resolvedUrl;
  }

  if (!db) {
    // No database → no adapter → no providers. auth-astro logs a warning
    // and any sign-in attempt fails gracefully instead of crashing the
    // build.
    return defineConfig({ providers: [] });
  }
  return defineConfig({
    adapter: DrizzleAdapter(db, {
      usersTable: users,
      accountsTable: accounts,
      sessionsTable: sessions,
      verificationTokensTable: verificationTokens,
    }),
    providers: [
      GitHub({
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
      }),
    ],
    // JWT session strategy keeps the cookie self-describing — no extra
    // DB hit on every request. The `users` table still holds the
    // canonical record; we just don't store the live session there.
    session: { strategy: "jwt" },
    callbacks: {
      // Surface the `users.id` UUID on `session.user.id` so server
      // code (getOrCreateLearner) can match it without re-resolving.
      async session({ session, token }) {
        if (session.user && token.sub) {
          (session.user as { id?: string }).id = token.sub;
        }
        return session;
      },
    },
  });
}
