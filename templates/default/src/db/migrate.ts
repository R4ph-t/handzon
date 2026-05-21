import { runMigrations } from "handzon-core/server/db/migrate.ts";

runMigrations("./drizzle")
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
