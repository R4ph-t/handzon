---
title: Project Structure
description: Learn the generated Handzon project layout and the files you will edit most often.
---

Every generated Handzon site starts from the default Astro template. Most authoring happens in `src/content/tutorials/`.

```text
my-tutorials/
├── AGENTS.md
├── astro.config.mjs
├── render.yaml
├── render.full.yaml
├── src/
│   ├── content/
│   │   └── tutorials/
│   │       ├── _index.json
│   │       └── react-todo/
│   │           ├── _meta.json
│   │           ├── 01-setup.mdx
│   │           └── 02-list.mdx
│   ├── pages/
│   │   ├── api/
│   │   └── settings/
│   └── styles/
└── skills/
```

## Files authors edit

`src/content/tutorials/_index.json`
: Controls homepage ordering. Listed tutorials appear first. Unlisted tutorials are appended alphabetically.

`src/content/tutorials/<slug>/_meta.json`
: Holds the tutorial title, description, tags, tracks, cover, starter, AI config, and other tutorial-level metadata.

`src/content/tutorials/<slug>/NN-step.mdx`
: One step page. The numeric prefix controls order and is removed from the URL.

`src/content/tutorials/<slug>/assets/`
: Preferred home for tutorial-specific images, diagrams, screenshots, and covers.

`src/styles/themes/`
: Theme tokens for colors, fonts, spacing, shadows, and code highlighting.

## Infrastructure files

`render.yaml`
: Lightweight Render Blueprint. Deploys the tutorial site and optional AI service without Postgres.

`render.full.yaml`
: Full Render Blueprint. Adds Postgres for GitHub sign-in, server-side learner records, and cross-device progress.

`src/pages/settings/tokens.astro`
: Learner-facing MCP token setup page for editors and agents.

`src/pages/api/mcp/index.ts`
: The MCP endpoint used by agent clients.

## Agent instructions

Generated projects include `AGENTS.md` as a compact local reference for coding agents. The docs you are reading are the canonical source; `AGENTS.md` keeps the minimum rules an agent needs while working inside a scaffolded project.
