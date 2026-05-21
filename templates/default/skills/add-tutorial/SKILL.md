---
name: add-tutorial
description: Scaffold a new tutorial folder with _meta.json, cover stub, and a first step.
triggers: ["add tutorial", "new tutorial", "create tutorial"]
---

1. Confirm the title with the author. Slugify it (`my-cool-tutorial`).
2. Create the folder: `src/content/tutorials/<slug>/`.
3. Write `_meta.json` with at minimum `title`, `description`, `difficulty`, and `tags`. See `AGENTS.md` for the full schema.
4. Write `01-introduction.mdx` with frontmatter (`title`, `duration`, `summary`) and a `<Callout type="tip">` placeholder.
5. Append the new slug to the `order` array in `src/content/tutorials/_index.json` (create the file with `{ "order": [] }` if it doesn't exist).
6. If the author plans cover art, mention they can drop it at `./assets/cover.png` and reference it from `_meta.json.cover`.

**Shortcut:** `pnpm handzon:new` does steps 1-5 interactively.
