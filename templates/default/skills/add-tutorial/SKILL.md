---
name: add-tutorial
description: Scaffold a new tutorial folder with _meta.json, cover stub, and a first step.
triggers: ["add tutorial", "new tutorial", "create tutorial"]
---

1. Confirm the title with the author. Slugify it (`my-cool-tutorial`).
2. Find the highest existing prefix in `src/content/tutorials/`. Use the next integer (zero-padded to 2 digits).
3. Create the folder: `src/content/tutorials/<NN>-<slug>/`.
4. Write `_meta.json` with at minimum `title`, `description`, `difficulty`, and `tags`. See `AGENTS.md` for the full schema.
5. Write `01-introduction.mdx` with frontmatter (`title`, `duration`, `summary`) and a `<Callout type="tip">` placeholder.
6. If the author plans cover art, mention they can drop it at `./assets/cover.png` and reference it from `_meta.json.cover`.

**Shortcut:** `pnpm handzon:new` does steps 1-5 interactively.
