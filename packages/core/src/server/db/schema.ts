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
export { accounts, sessions, users, verificationTokens } from "../auth/schema.ts";

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

/**
 * Personal access tokens for the per-user MCP surface.
 *
 * Created by the settings/tokens page in the scaffold template. Stored
 * as SHA-256 hashes of `hzn_pat_<32 base64url bytes>` strings — the
 * raw token is shown to the learner once at mint time and never
 * persisted. The MCP v2 OAuth proxy reuses this table, so the row
 * shape is forward-compatible with DCR-minted tokens.
 *
 * scopes: comma-separated; v1 known values are "progress:read" and
 * "progress:write". Catalog reads don't require any scope beyond a
 * valid token.
 */
export const learnerApiTokens = pgTable("learner_api_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  tokenHash: text("token_hash").notNull().unique(),
  scopes: text("scopes").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
});

/**
 * Help-bridge inbox: pending help requests posted by the agent on
 * the learner's machine (`request_help` MCP tool). ChatPanel reads
 * pending rows on open, prepends them as a user turn, and marks
 * them consumed so the next open doesn't re-replay them.
 */
export const helpRequests = pgTable(
  "help_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    learnerId: uuid("learner_id")
      .notNull()
      .references(() => learners.id, { onDelete: "cascade" }),
    tutorialSlug: text("tutorial_slug").notNull(),
    stepSlug: text("step_slug").notNull(),
    query: text("query").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
  },
  (table) => ({
    byLearnerPending: index("help_requests_by_learner_pending").on(
      table.learnerId,
      table.consumedAt,
    ),
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
