import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "../auth/schema.ts";

// Re-export the Auth.js tables so consumers (and drizzle-kit) see one
// schema barrel.
export { users, accounts, sessions, verificationTokens } from "../auth/schema.ts";

export const learners = pgTable(
  "learners",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Nullable now — signed-in learners don't need a device cookie.
    deviceId: text("device_id"),
    // Optional FK to the Auth.js user. Set on first sign-in via the
    // claim transaction; null for anonymous learners.
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    // Partial uniques: only enforced when the column is non-null. Lets
    // multiple signed-in learners coexist without device ids and avoids
    // the historical `device_id NOT NULL UNIQUE` constraint blocking
    // user-only rows.
    deviceIdUnique: uniqueIndex("learners_device_id_unique")
      .on(table.deviceId)
      .where(sql`${table.deviceId} IS NOT NULL`),
    userIdUnique: uniqueIndex("learners_user_id_unique")
      .on(table.userId)
      .where(sql`${table.userId} IS NOT NULL`),
  }),
);

export const progressEntries = pgTable(
  "progress_entries",
  {
    learnerId: uuid("learner_id")
      .notNull()
      .references(() => learners.id, { onDelete: "cascade" }),
    // 'step' | 'checkpoint' | 'quiz' | 'pref' | 'lastVisited' | 'tutorial'
    // The 'tutorial' kind keys aggregate popularity events. Two keys
    // matter for cross-learner counts: 'started' (first step view per
    // learner) and 'completed' (all steps in the tutorial complete).
    // The composite PK guarantees each learner is counted at most once
    // per (slug, key), so a plain COUNT(*) gives unique-learner totals.
    kind: text("kind").notNull(),
    scope: text("scope").notNull(), // tutorial slug or 'global'
    key: text("key").notNull(),
    value: jsonb("value").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.learnerId, table.kind, table.scope, table.key] }),
    byLearner: index("progress_by_learner").on(table.learnerId, table.scope),
  }),
);
