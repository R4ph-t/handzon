---
title: Handzon Documentation
description: Build and publish hands-on tutorial sites with Astro, MDX, progress tracking, AI assistance, and MCP.
template: splash
hero:
  tagline: Astro + MDX tutorial sites
  title: Build hands-on tutorials people can finish.
  image:
    file: ../../assets/handzon-logo-light.svg
  actions:
    - text: Get started
      link: /getting-started/installation/
      icon: right-arrow
    - text: View on GitHub
      link: https://github.com/R4ph-t/handzon
      icon: external
---

Handzon turns folders of MDX into interactive tutorial sites. Authors write numbered steps. The site adds the parts static docs can't: progress tracking, checkpoints, quizzes, runnable playgrounds, and machine-verified exercises. Optional pieces add GitHub sign-in, an AI tutor, and an MCP endpoint so coding agents can work through tutorials alongside learners.

## What Handzon gives you

- **File-based tutorials**: a tutorial is a folder of numbered MDX steps plus a `_meta.json` file. Everything lives in git.
- **Interactive steps**: checkpoints, quizzes, reveals, terminals, file trees, and runnable playgrounds.
- **Progress tracking**: browser-local by default. Add GitHub sign-in and Postgres when you need cross-device sync or cohort tracking.
- **Multi-language tracks**: support Python, TypeScript, Go, or any other track without duplicating shared prose.
- **AI tutor**: an optional in-browser tutor with per-tutorial tone, references, and anti-spoiler defaults.
- **MCP built in**: optionally expose tutorials over MCP so Cursor, Claude Code, Codex, and other agents can read steps, start workspaces, and update progress.
- **Deploys like any Astro app**: Render Blueprints included, no platform lock-in.

## Common paths

- Start with [Install Handzon](/getting-started/installation/) if you are creating a new tutorial site.
- Read [Tutorials and Steps](/content/tutorials/) to understand the content model.
- Use [Multi-Language Tracks](/guides/tracks/) when one tutorial needs multiple programming-language paths.
- Use [Covers and Media](/guides/covers-and-media/) to add cards, hero images, videos, or slide decks.
- Set up the [AI Tutor](/guides/ai-tutor/) and [Verify Specs and MCP](/guides/verify-and-mcp/) when you want assisted or agent-driven learning.
- Pick a Blueprint in [Deploy on Render](/deploy/render/) when you are ready to ship.
- Keep [Components](/components/overview/) open while authoring MDX.
