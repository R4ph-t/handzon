# __PROJECT_NAME__

A Google Codelab-style hands-on tutorial site, built with [Handzon](https://github.com/your-org/handzon).

## Getting started

```bash
pnpm install
pnpm dev          # http://localhost:4321
```

## Authoring

```bash
pnpm handzon:new     # create a new tutorial
pnpm handzon:step    # add a step to an existing tutorial
```

Tutorials live under `src/content/tutorials/<slug>/`. See `AGENTS.md` for the full content model + component catalog.

## Theming

The active theme lives in `src/styles/global.css`. The default is `brutalist-dark`. Swap one `@import` line to switch.

## Deploying

Two Blueprints ship in this repo:

- `render.yaml` — Tier 1 (Render Static Site, no Postgres, BYOK-only AI).
- `render.full.yaml` — Tier 2 (Render Web Service + Postgres for cross-device progress + server-side AI proxy).
