---
title: Install Handzon
description: Scaffold a tutorial site, run it locally, and create your first tutorial.
---

Use `create-handzon` to scaffold a new tutorial site:

```bash
npx create-handzon my-tutorials
cd my-tutorials
pnpm dev
```

The local site starts at `http://localhost:4321`.

## Authoring commands

Run these commands inside the generated project:

```bash
pnpm handzon:new     # create a tutorial folder and _meta.json
pnpm handzon:step    # add a numbered MDX step
pnpm handzon:skills  # install authoring skills into your agent
```

Generated tutorials live under `src/content/tutorials/<slug>/`. The CLI keeps tutorial files plain and portable: `_meta.json` holds tutorial-level metadata, and numbered `.mdx` files become ordered steps.

## Local development loop

The generated project is a regular Astro app:

```bash
pnpm dev      # run the local server
pnpm build    # build for production
pnpm preview  # preview the production build
pnpm check    # run Astro checks
```

Use the dev server while editing tutorials. Astro reloads when you change MDX, JSON, styles, or config.

## What you get

A fresh scaffold includes:

- An Astro and MDX tutorial site.
- A homepage with cards, tags, filters, cover media, and progress.
- Tutorial landing pages and step pages.
- Built-in MDX components for lessons, checks, diagrams, and playgrounds.
- Browser-local progress tracking by default.
- Optional GitHub sign-in and Postgres-backed progress sync.
- An optional AI tutor service.
- An MCP endpoint that agents can use to read tutorials and update progress.
- Render Blueprints for lightweight and full deployments.
