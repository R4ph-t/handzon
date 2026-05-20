---
name: review-tutorial
description: Editorial pass on a tutorial before publishing.
triggers: ["review", "edit pass", "publish check"]
---

Read the tutorial top-to-bottom and check each item below.

**Structure**
- [ ] Every step has a `title`, optional `duration`, and optional `summary` in frontmatter.
- [ ] Every step ends with a `<Recap>`.
- [ ] Every step ends with a `<Checkpoint>` if the tutorial is gated.
- [ ] At least one `<Quiz>` per tutorial.

**Content**
- [ ] First sentence of step 1 sets context. ("In this step you'll …")
- [ ] No step is longer than ~10 minutes of reading.
- [ ] Code blocks have `title="..."` where the file matters.
- [ ] Terminal output uses `<Terminal>` rather than a fenced block with line breaks.
- [ ] Multi-platform commands use `<Tabs group="...">` so selection persists.

**Polish**
- [ ] Run `pnpm check` — no Astro/TS errors.
- [ ] No `TODO`, `XXX`, or `FIXME` left in the body.
- [ ] All co-located assets are referenced; no orphans in `./assets/`.
- [ ] `_meta.json.estimatedDuration` matches the sum of step `duration` values (or is omitted).
- [ ] Open the tutorial in `pnpm dev` and click through every step.
