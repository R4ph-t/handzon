---
name: deploy-to-render
description: Deploy a Handzon site to Render via a Blueprint.
triggers: ["deploy", "render", "ship", "go live"]
---

1. Decide tier:
   - **Tier 1 (default)** — Render Static Site. Use `render.yaml`. No DB, no server, cheapest path. Cross-device sync is OFF.
   - **Tier 2** — Render Web Service + Render Postgres. Use `render.full.yaml`. Cross-device sync is ON, AI proxy lives server-side.
2. If you picked Tier 1: delete `render.full.yaml` (or leave it — only `render.yaml` is read by Render's "New → Blueprint" flow).
3. Push the repo to GitHub.
4. In the Render Dashboard: **New → Blueprint → connect repo → Apply**.
5. After the first deploy:
   - For Tier 2, open the service's env tab and set the AI provider keys you marked `sync: false` (e.g. `ANTHROPIC_API_KEY`). The Blueprint won't create these for you on purpose.
   - Hit the deployed URL and click through one tutorial end-to-end.
6. For previews on PRs: Blueprint already sets `pullRequestPreviewsEnabled: true`, so every PR gets a temporary URL.

**Gotchas**
- `staticPublishPath: ./dist` is correct because the Astro build outputs to `dist/`.
- Tier 2's `buildCommand` runs `pnpm db:migrate` before `pnpm build` so a fresh deploy can't outpace the schema.
- The `@astrojs/node` adapter must run in `mode: 'standalone'` and bind to `0.0.0.0:$PORT` — both already wired in `astro.config.mjs`.
