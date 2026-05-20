import { migrate } from "drizzle-orm/postgres-js/migrator";
import { getDb } from "handzon/server/db/client.ts";

async function main() {
  if (!process.env.DATABASE_URL) {
    console.log("DATABASE_URL not set — skipping migrations (Tier 1 build).");
    return;
  }
  const db = getDb();
  console.log("Running migrations…");
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("Migrations complete.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
