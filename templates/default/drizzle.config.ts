import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./node_modules/@handzon/ui/src/server/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
  strict: true,
  verbose: true,
});
