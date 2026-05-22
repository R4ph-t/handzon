-- Personal access tokens for the per-user MCP surface. Created via
-- the /settings/tokens page; consumed by resolveBearerLearner on
-- /api/mcp. token_hash is SHA-256 of the raw `hzn_pat_…` string;
-- the raw value is never stored.
CREATE TABLE IF NOT EXISTS "learner_api_tokens" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "token_hash" text NOT NULL UNIQUE,
  "scopes" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "last_used_at" timestamptz,
  "expires_at" timestamptz
);

CREATE INDEX IF NOT EXISTS "learner_api_tokens_user_id_idx"
  ON "learner_api_tokens" ("user_id");
