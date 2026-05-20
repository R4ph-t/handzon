/**
 * Auth.js config factory consumed by the scaffold's `auth.config.ts`.
 *
 * Usage (scaffold side):
 *
 *   import { createAuthConfig } from "handzon-ui/server/auth/config";
 *   import { getDb } from "handzon-ui/server/db/client";
 *   export default createAuthConfig({ db: getDb() });
 *
 * GitHub is the only provider in 0.2; email/password and others are
 * out of scope (see plan: github-auth_d52529d5).
 */
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import GitHub from "@auth/core/providers/github";
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

export function createAuthConfig({ db }: AuthConfigOptions) {
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
