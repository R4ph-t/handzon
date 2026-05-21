/**
 * Drizzle migration runner used by the scaffold's `db:migrate` script
 * (and the Tier 2 Blueprint's `preDeployCommand`). Keeping it inside
 * the framework lets the scaffold's `package.json` stay free of a
 * direct `drizzle-orm` dependency — the previous setup imported
 * `drizzle-orm/postgres-js/migrator` from the scaffold itself, which
 * only resolved when pnpm's `shamefully-hoist=true` was on the
 * workspace `.npmrc`. Render's strict install rejected it.
 *
 * Usage (scaffold side):
 *
 *   import { runMigrations } from "handzon-core/server/db/migrate";
 *   runMigrations("./drizzle")
 *     .then(() => process.exit(0))
 *     .catch((e) => { console.error(e); process.exit(1); });
 */
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { getDb } from "./client.ts";

export async function runMigrations(migrationsFolder: string): Promise<void> {
  if (!process.env.DATABASE_URL) {
    console.log("DATABASE_URL not set — skipping migrations (Tier 1 build).");
    return;
  }
  const db = getDb();
  console.log("Running migrations…");
  await migrate(db, { migrationsFolder });
  console.log("Migrations complete.");
}
