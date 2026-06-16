# AGENTS.md

You're editing a tutorial site built with **Handzon**. The canonical author docs live in the Handzon repository at `sites/docs`. This file is the local quick-reference for agents working inside a generated project.

## What This Project Is

A Handzon project is an Astro + MDX tutorial site. Authors write tutorials as files, learners work through step pages, and optional MCP tools let coding agents read tutorial source, start workspaces, verify checkpoints, and update learner progress.

## Content Model

Every tutorial lives under `src/content/tutorials/<slug>/`:

```text
src/content/tutorials/react-todo/
├── _meta.json
├── 01-setup.mdx
├── 02-list.mdx
└── assets/
    └── cover.png
```

- The folder name is the tutorial slug and URL segment.
- Step files use numeric prefixes for ordering. The prefix does not appear in the URL.
- Homepage order lives in `src/content/tutorials/_index.json`.
- Tutorial-specific images, diagrams, covers, and screenshots should be co-located in `assets/`.

## `_meta.json` Quick Reference

Required:

- `title`
- `description`

Common optional fields:

- `published`: set `false` for drafts that should not be reachable.
- `hidden`: hide from homepage and MCP listing while keeping direct URLs.
- `tags`, `difficulty`, `estimatedDuration`, `prerequisites`
- `cover`: image for cards, landing pages, and social previews.
- `icon`: compact marker beside the tutorial title.
- `tracks`: tutorial-wide programming-language variants.
- `defaultTrack`: default track id.
- `starter`: shared or per-track workspace starter for MCP agents.
- `gated`: require checkpoints before learners can continue.
- `ai`: per-tutorial AI tutor configuration.

## Tracks

Use tracks when one tutorial supports multiple programming-language paths:

```json
{
  "tracks": [
    { "id": "py", "label": "Python" },
    { "id": "ts", "label": "TypeScript" }
  ],
  "defaultTrack": "py"
}
```

Rules:

- Track ids should be stable and short, such as `py`, `ts`, `go`, or `rust`.
- Use `<Track id="py">...</Track>` around track-specific prose, code, terminals, or playgrounds.
- Keep shared prose outside `<Track>`.
- Use `<Tabs>` for local choices like package manager or OS, not for tutorial-wide language choices.
- `starter` and step `verify` can be shared specs or per-track maps. If using a per-track map, include every declared track.
- Do not use `lang` to mean track. `lang` is only a code-fence syntax identifier.

## Step Frontmatter

```yaml
---
title: Set up the project
duration: 5 min
summary: Install dependencies and start the local dev server.
heroMedia:
  kind: image
  src: ./assets/setup.png
  alt: Terminal showing the local dev server
---
```

`heroMedia` can be:

- `kind: image` with `alt`
- `kind: video` with `title`
- `kind: slides` with `title` and optional `slide`

## Components

MDX components are globally available. Do not import them.

Static:

- `<Callout type="info" | "tip" | "warn" | "danger">`
- `<Hint>`
- `<Collapsible title="..." open>`
- `<Steps>` and `<Step>`
- `<File>`
- `<Figure src="..." alt="..." caption="..." width={640}>` for bordered images with optional captions
- `<Recap>`
- `<Embed>` for videos or slide decks
- `<Download>`
- `<Track>`

Interactive:

- `<Tabs>` and `<Tab>`
- `<FileTree>`
- `<Reveal>`
- `<Terminal>`
- `<Mermaid>` for runtime diagrams; use fenced ` ```mermaid ` for static diagrams
- `<Diff>`
- `<Quiz>`
- `<Checkpoint>`
- `<Playground>` for JS/TS Sandpack exercises

## Code Fences

Fenced code blocks use Expressive Code:

- `title="src/index.ts"` for filename labels.
- `{2,4-6}` for line highlights.
- `diff` fences for patch snippets.
- Fence language controls syntax highlighting only.

## Verification and MCP

Use a step `verify` spec when an agent can prove the learner's work. The `verify.id` must match a `<Checkpoint id="...">` in the step body.

Every generated site exposes MCP at `/api/mcp`. Learners configure tokens at `/settings/tokens`.

Read tools include `list_tutorials`, `get_tutorial`, `start_tutorial`, `get_step`, and `get_progress`.

Write tools include `complete_checkpoint`, `uncheck_checkpoint`, `complete_step`, `mark_step_incomplete`, `record_quiz`, `set_last_visited`, `set_preference`, `request_help`, and `submit_verification`.

## Theming

Never hardcode colors, radii, or fonts in tutorial content. Use theme tokens in `src/styles/themes/`.

Theme files must use `@theme static {}`. `src/styles/global.css` must import `handzon-core/styles/global.css` before the active theme.

## Common Tasks

| You want to... | Run |
| --- | --- |
| Create a tutorial | `pnpm handzon:new` |
| Add a step | `pnpm handzon:step` |
| Run the dev server | `pnpm dev` |
| Build | `pnpm build` |
| Check types and Astro diagnostics | `pnpm check` |
| Generate a DB migration | `pnpm db:generate` |
| Run pending migrations | `pnpm db:migrate` |

## Don't

- Don't import MDX components.
- Don't add inline `style` props in MDX for theme-related styling.
- Don't skip a numeric prefix on a step file.
- Don't commit `.env` or any file with an API key.
- Don't put tutorial-specific images in `public/`; co-locate them under the tutorial's `assets/` directory.
- Don't replace the theme by editing component CSS; create or edit a theme file under `src/styles/themes/`.
