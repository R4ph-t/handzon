-- Speeds up the cross-learner aggregation in /api/tutorials/stats,
-- which filters `progress_entries` by `kind = 'tutorial'` and groups
-- by (scope, key). The composite primary key already covers this
-- prefix order-wise, but a narrower (kind, scope) index keeps the
-- planner honest as the table grows and as other kinds dominate.
CREATE INDEX IF NOT EXISTS "progress_kind_scope" ON "progress_entries" ("kind", "scope");
