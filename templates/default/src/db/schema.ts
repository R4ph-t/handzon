import { index, jsonb, pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const learners = pgTable("learners", {
  id: uuid("id").primaryKey().defaultRandom(),
  deviceId: text("device_id").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const progressEntries = pgTable(
  "progress_entries",
  {
    learnerId: uuid("learner_id")
      .notNull()
      .references(() => learners.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(), // 'step' | 'checkpoint' | 'quiz' | 'pref' | 'lastVisited'
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

export const transferCodes = pgTable("transfer_codes", {
  code: text("code").primaryKey(),
  learnerId: uuid("learner_id")
    .notNull()
    .references(() => learners.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});
