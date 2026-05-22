-- Help-bridge inbox. The MCP `request_help` tool inserts pending
-- rows on the learner's behalf; the in-browser ChatPanel reads
-- consumed_at IS NULL rows on open, replays them as the first user
-- turn, and stamps consumed_at to retire them.
CREATE TABLE IF NOT EXISTS "help_requests" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "learner_id" uuid NOT NULL REFERENCES "learners"("id") ON DELETE CASCADE,
  "tutorial_slug" text NOT NULL,
  "step_slug" text NOT NULL,
  "query" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "consumed_at" timestamptz
);

CREATE INDEX IF NOT EXISTS "help_requests_by_learner_pending"
  ON "help_requests" ("learner_id", "consumed_at");
