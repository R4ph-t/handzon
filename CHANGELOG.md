# Changelog

## 0.8.0 (`handzon-core`)

**Agentic tooling menu.** Substantial new surface that turns Handzon
from "a tutorial site with an in-app tutor" into "a tutorial site
that any AI agent can drive". Three families of features, layered
so authors can opt in to whichever they want.

### Added — in-app tutor touchpoints (gated on `aiConfig.enabled`)

- `<HelpMe topic="..." />` MDX block — author-placed inline trigger
  that opens the tutor pre-seeded with `{ kind: "unstuck", topic }`.
- `<CopyPrompt template="..." />` MDX block — author-templated prompt
  with `{{stepSource}}` / `{{tutorialTitle}}` placeholders; renders a
  "Copy prompt" button. Works whether the in-app tutor is enabled or
  not (Family B).
- Quiz "Why is this wrong?" affordance on incorrect submissions.
- Checkpoint "Stuck?" nudge — delayed via IntersectionObserver +
  timer, one-shot per step.
- Selection-anchored "Ask about this" floating button inside the
  tutorial article.
- Playground "Ask AI to fix" toolbar button — finally wires the
  previously-unused `tools.suggestPlaygroundEdit` flag.
- Auto step-footer "Stuck on this step?" via the new
  `aiConfig.autoStepHelp` opt-in.
- Per-step "Open in Cursor / Claude / ChatGPT / VS Code" deep-link
  row; "Copy step as Markdown" button.
- `buildAssistantPrompt(context, intent)` shared primitive at
  `lib/ai/prompts.ts` that backs every touchpoint above. Same input
  shape renders to chat seed messages, copyable Markdown, and deep
  links.

### Added — per-user MCP (Family C)

- Remote HTTP MCP endpoint mounted at `/api/mcp/` (in the scaffold
  template) with JSON-RPC transport. Read tools (`list_tutorials`,
  `get_tutorial`, `get_step`, `get_progress`, `get_progress_summary`)
  and write tools (`complete_checkpoint`, `uncheck_checkpoint`,
  `complete_step`, `mark_step_incomplete`, `record_quiz`,
  `set_last_visited`, `set_preference`).
- Personal Access Token auth via the new `learner_api_tokens` table
  (`hzn_pat_…` format, SHA-256 hashed, with scopes). New
  `resolveBearerLearner(request)` in `server/auth.ts`.
- SSE live-sync at `/api/progress/events`. Both cookie POST and MCP
  writes fan out via a per-learner `EventTarget`; `useProgress`
  subscribes via `EventSource`. MCP writes update the open browser
  tab instantly.
- "Help bridge" — `help_requests` table + `request_help` MCP tool.
  `ChatPanel` reads its pending inbox on open and prepends as a user
  turn. "I'm stuck" in Cursor surfaces inside the browser tutor on
  tab focus.

### Added — machine-verifiable checkpoints (Family D)

- `verify` step frontmatter: declared `file_exists` / `file_contains`
  / `shell` / `http` checks per step, with per-check `hint` strings.
  Build-time validation rejects a step whose `verify.id` doesn't
  match a `<Checkpoint id>` in the same MDX body.
- Deterministic evaluator at `server/verify/evaluator.ts` — pure
  function from `(spec, agent-reported results)` to
  `{ passed, failingCheckIndex?, hint? }`. The agent posts observed
  values; the server decides pass/fail.
- `submit_verification` MCP tool that runs the evaluator and calls
  `complete_checkpoint` on pass.
- Inline failure feedback under `<Checkpoint>` — a
  `.checkpoint-feedback` block hydrated from a new
  `state.verificationFeedback[stepKey]` field, fed by the SSE
  channel. Clears on next pass or step nav.
- `kind: "verification"` telemetry rows per submission for authors
  to mine; tombstone-cleaned on `removeCheckpoint`.

### Schema migrations

- `0003_learner_api_tokens.sql` — PAT storage.
- `0004_help_requests.sql` — help bridge inbox.

## 0.7.0 (`create-handzon`)

New scaffolds gain the full agentic surface from `handzon-core@0.8.0`.
CLI source itself is unchanged; the bundled template ships:

- `/settings/tokens` page — create / list / revoke Personal Access
  Tokens. Tokens are shown once at mint time.
- `/api/mcp/index.ts` — mounts the remote MCP endpoint.
- `/api/progress/events.ts` — SSE handler for live progress sync.
- `/[tutorial]/llms.txt.ts` — per-tutorial `llms.txt` endpoint
  concatenating step source for bring-your-own-agent users.
- New `add-verify-checks` skill with a matrix for picking the right
  check kind per outcome and rules for writing failure-cause hints.
  `add-checkpoint` cross-references it; `review-tutorial` warns on
  gated steps lacking `verify.checks`.
- Drizzle migrations 0003 / 0004 (PAT + help requests).

The template's `workspace:*` references to `handzon-core` and
`handzon-ai` are rewritten by the CLI's `tsup` build to `^0.8.0` and
`^0.2.0` respectively, so fresh scaffolds pin the matching releases.

## 0.1.0 (`handzon-mcp`, new package)

Initial release. A thin stdio↔HTTP wrapper that proxies to a deployed
Handzon site's remote MCP endpoint. For agents whose MCP client
doesn't yet support remote HTTP/SSE transport.

```
npx handzon-mcp --site https://<your-tutorial-site> --token hzn_pat_...
```

Implemented as a single executable JS file (`packages/mcp-stdio/src/
index.js`). No build step, no dependencies beyond Node 22.

## 0.7.0 (`handzon-core`)

**Checkpoints are now togglable.** Clicking a `<Checkpoint>` a second
time unchecks the step, removes the checkpoint record, and re-locks
the Next button on gated tutorials. Previously the click handler
short-circuited when the checkpoint was already complete, so a
mis-clicked step was permanent.

### Added

- `removeCheckpoint(id)` on `useProgress`.
- `POST /api/progress` now treats `value: null` as a tombstone and
  deletes the matching row. The remote progress store uses this to
  sync unchecks across devices so a server snapshot fetch no longer
  resurrects a locally-removed checkpoint.

### Fixed

- The streaming "thinking" indicator in the chat panel now has
  `role="status"` so screen readers announce it as a live region.

## 0.6.3 (`create-handzon` only)

Republish so new scaffolds pin `handzon-core@^0.7.0`. No behavioral
change to the CLI itself.

## 0.6.2 (`create-handzon` only)

`init` now runs `git init -b main` instead of plain `git init`, so
fresh scaffolds land on the `main` branch regardless of the user's
`init.defaultBranch` setting. Requires git >= 2.28 (July 2020).

## 0.6.1 (`create-handzon` only)

Fixes a 403 "Cross-site POST form submissions are forbidden" on every
form POST (Auth.js sign-in, `/api/progress`, …) on Render and any
other TLS-terminating reverse proxy.

The template's `astro.config.mjs` now sets `security.allowedDomains:
[{}]`, which tells Astro's `checkOrigin` middleware to honour
`X-Forwarded-Host` and `X-Forwarded-Proto`. Without it, Astro
constructs `url.origin` as `http://localhost:PORT` (TLS terminated
at the edge, plain socket internally) and rejects the request
against the browser's `Origin: https://<site>.onrender.com`.

Existing 0.6.0 scaffolds: paste the `security:` block from
`templates/default/astro.config.mjs` into your own `astro.config.mjs`.

## 0.6.0

**Rename: `handzon-ui` → `handzon-core`.**

The framework package collected server handlers, the database schema,
auth config, and runtime libs alongside the actual UI. The name no
longer matched what was inside, and the same misnomer was about to
get worse with the new migration runner. Renaming once before the
package gains more non-UI surface area is cheaper than splitting
later.

The new `handzon-core` also hosts `runMigrations()`, the Drizzle
migration runner that the scaffold's `db:migrate` script used to
import directly. The scaffold no longer pulls `drizzle-orm` into
its own dependency closure — which fixes a Render pre-deploy crash
(`ERR_MODULE_NOT_FOUND: Cannot find package 'drizzle-orm'`) that
struck any deploy without `shamefully-hoist=true` on the workspace
`.npmrc`.

### Migration for existing 0.5.x scaffolds

1. `pnpm remove handzon-ui` and `pnpm add handzon-core@^0.6.0`.
2. Search-and-replace `handzon-ui` → `handzon-core` across the
   scaffold source. The 8–10 sites are typically: `auth.config.ts`,
   `astro.config.mjs`, `drizzle.config.ts` (the `schema:` path
   includes the package name), `src/content.config.ts`,
   `src/config/{site,ai}.ts`, `src/styles/global.css`'s `@import`,
   and the `src/pages/{healthz.ts,api/**,**.astro}` re-exports.
3. Rewrite `src/db/migrate.ts` to a thin re-export:
   ```ts
   import { runMigrations } from "handzon-core/server/db/migrate.ts";
   runMigrations("./drizzle")
     .then(() => process.exit(0))
     .catch((e) => { console.error(e); process.exit(1); });
   ```
4. `pnpm install` to refresh the lockfile.

`handzon-ui` 0.5.0 stays on npm but receives no further releases.

## 0.5.1 (`create-handzon` only)

- Bundled-template version pins are now read from
  `packages/{ui,ai}/package.json` at tsup build time instead of being
  a hand-maintained constant in `tsup.config.ts`. Closes the silent
  drift bug that froze scaffolds at `handzon-ui@^0.3.0` from 0.4.0
  onward. From now on, bumping `handzon-ui` is enough — a CLI rebuild
  picks up the new version automatically.

## 0.5.0

**Cross-learner tutorial popularity + zero-config auth URL on Render.**

### `handzon-ui`

- New `kind: "tutorial"` events in `progress_entries` track unique-learner
  `started` (first step view) and `completed` (all steps complete) per
  tutorial. New `GET /api/tutorials/stats` handler returns aggregate
  counts with a 60s in-memory cache; Tier 1 (no `DATABASE_URL`) returns
  an empty list.
- Tutorial cards on the home page hydrate the numbers
  (`▶ 234 started · ✓ 89 finished`) from `/api/tutorials/stats`, with a
  new "popular" pill in the FilterBar that re-orders cards via CSS
  `order` from a `data-popularity` score (`completed * 3 + started`).
- `TutorialLayout` fires the popularity events from its inline script —
  idempotent, so navigating between steps doesn't re-POST.
- `createAuthConfig` now resolves `AUTH_URL` from (in priority)
  explicit `AUTH_URL` (full URL or bare hostname expanded to
  `https://<host>.onrender.com`), `RENDER_EXTERNAL_URL`, or
  `RENDER_EXTERNAL_HOSTNAME`. Default Render deploys need no manual
  `AUTH_URL` config.

### Template (`render.full.yaml`)

- New `0002_tutorial_stats.sql` migration adds an index on
  `(kind, scope)` for fast aggregation.
- Drops the `AUTH_URL: sync: false` env var from the Tier 2 Blueprint;
  custom-domain users still override via the Dashboard.

### Upgrading

Existing 0.4.x scaffolds:

1. `pnpm update handzon-ui@^0.5.0`.
2. `pnpm db:migrate` to apply `0002_tutorial_stats.sql`.
3. Optionally remove the `AUTH_URL` env var from your Render service if
   you're on `.onrender.com` — it'll be derived automatically.

## 0.2.0

**Refactor: handzon is now a framework, not a scaffold copy.**

The CLI used to copy every component, layout, style file, and the entire
AI server into each scaffolded project. That meant framework fixes never
reached existing users — they were frozen at whichever version they ran
`create-handzon` against.

0.2.0 splits that into two npm packages the scaffold depends on:

- `handzon-ui` — UI: layouts, components, lib helpers, content schemas,
  page templates, server handlers, styles.
- `handzon-ai` — the Hono + Mastra backend, installable as a
  `handzon-ai` bin.

The scaffolded project drops from ~60 framework files to ~10 user-owned
files (content, theme, config, env, render.yaml). Updates now flow via
`pnpm update handzon-ui handzon-ai`.

### Breaking

Any 0.1.x scaffold needs to migrate by hand: install the two packages,
delete the obsolete `src/components`, `src/layouts`, `src/lib`,
`src/styles/components`, `src/styles/base.css`, `src/styles/components.css`,
`services/ai/`, and `src/db/{client,schema}.ts`. Replace pages, content
config, API routes, and `db/migrate.ts` with the new thin re-export
forms. The structure of `src/config/site.ts` and `src/config/ai.ts`
stays the same, but `AiConfig` is now imported from `handzon-ui`.
