import { createAuthConfig } from "handzon-core/server/auth/config.ts";
import { getDb } from "handzon-core/server/db/client.ts";

// auth-astro picks this file up automatically from the project root.
// We defer the drizzle client until DATABASE_URL is set so Tier 1
// builds (and the first `pnpm build` on a fresh checkout) don't crash
// — sign-in is a no-op until the env is wired anyway.
const db = process.env.DATABASE_URL ? getDb() : null;

export default createAuthConfig({ db });
