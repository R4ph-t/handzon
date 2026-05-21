# Changelog

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
