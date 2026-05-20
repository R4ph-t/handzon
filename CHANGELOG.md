# Changelog

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
