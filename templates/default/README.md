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

## Configuration

Copy the example env files before running the dev server:

```bash
cp .env.example .env
cp services/ai/.env.example services/ai/.env
```

Both `PUBLIC_AI_SERVICE_URL` and `ALLOWED_ORIGIN` accept either a fully-qualified URL (for local dev or custom domains) or a bare Render private-network hostname — the latter is what `fromService.property: host` ships in the Blueprints, and the code expands it to `https://<host>.onrender.com` at runtime.

## Deploying

Two Blueprints ship in this repo:

- `render.yaml` — Tier 1: site + AI service as Node web services. Progress lives in localStorage. AI keys can be left unset to force BYOK-only.
- `render.full.yaml` — Tier 2: adds Postgres for cross-device progress sync. Run `pnpm db:migrate` once after the first deploy (the Blueprint wires it as a post-deploy hook).

After the first deploy, set the AI provider keys on the `<project>-ai` service in the Render Dashboard. The site reaches the AI service through `PUBLIC_AI_SERVICE_URL` (a `fromService.property: host` reference); browser code expands that to `https://<host>.onrender.com` automatically. Custom domain? Override the value to your full origin and it'll be used as-is.
