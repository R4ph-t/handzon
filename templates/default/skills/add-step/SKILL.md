---
name: add-step
description: Append a new step to an existing tutorial.
triggers: ["add step", "new step", "next step"]
---

1. Confirm which tutorial. List existing folders under `src/content/tutorials/` if unsure.
2. Slugify the step title.
3. Find the highest numeric prefix among `*.mdx` files in that tutorial folder. Use the next integer.
4. Write `<NN>-<step-slug>.mdx` with frontmatter:

   ```yaml
   ---
   title: <human title>
   duration: 5 min
   summary: <one-line teaser>
   ---
   ```

5. Stub the body with a `<Callout type="tip">` placeholder and a closing `<Recap items={["...", "..."]} />`.

**Shortcut:** `pnpm handzon:step` does this interactively.
