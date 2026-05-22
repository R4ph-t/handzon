---
name: add-step
description: Add a new step to an existing Handzon tutorial. Reads the tutorial first to honor its gating, tone, and arc; confirms placement and components with the author; then scaffolds a populated step file and keeps _meta.json honest.
triggers: ["add step", "new step", "next step", "append step", "insert step", "add a section"]
---

Use this when the author wants to add a step to an *existing* tutorial. If they're starting a new tutorial, use `add-tutorial` instead.

If the author already knows exactly what they want and just needs the file, point them at the shortcut at the bottom and stop.

## 1. Read the tutorial first

Before asking the author anything, gather context:

1. **Pick the tutorial.** If the author didn't name one, list folders under `src/content/tutorials/` (excluding `_index.json`) and ask which.
2. **Load `<slug>/_meta.json`**. Note three things that change how you scaffold:
   - `gated: true` → every step must end with a `<Checkpoint>` before the `<Recap>`.
   - `difficulty` → sets the tone of the new step.
   - `estimatedDuration` → if present, you'll need to update it in step 5.
3. **List the existing steps** (`ls <slug>/*.mdx`) to see the arc and find the highest numeric prefix.
4. **Read the most recent step** to absorb the author's voice, the components they've been using, and what the reader has just done. Don't repeat that step — build on it.

## 2. Confirm purpose and placement (one question per turn)

Skip anything the author already volunteered. Ask the rest in order:

1. **Purpose** — finish the sentence: *"After this step, the reader can ___."* One concrete capability. If they say "learn about X", push back once for the action verb.
2. **Placement** — where does the step go?
   - **Append** (most common) — next integer after the highest existing prefix.
   - **Insert between two steps** — pick an unused prefix that sorts correctly. Prefixes are sortable strings (`02a-`, `02b-`, `025-` all work between `02-` and `03-`). Prefer alphabetic suffixes (`02a-`) over renumbering.
   - **Renumber existing steps** — only if the author explicitly asks. Flag the cost (every existing step file gets renamed, URLs change, anyone who linked to a step breaks).
3. **Duration** — 3, 5, or 10 min? Use this for the step's frontmatter and for the `_meta.json.estimatedDuration` re-sum in section 5.

## 3. Match the step to components

Don't ship a prose-heavy step. Before writing the file, pick the components that fit what the step is doing. Common mappings:

- **Showing project / folder structure** → `<FileTree paths={[...]}>` (not a code fence with slashes)
- **Showing a command and its output** → `<Terminal entries={[{command, output}]}>` (not a fenced bash block)
- **Variants** (npm/pnpm/yarn, mac/linux/windows, SQLite/Postgres) → `<Tabs group="...">` — reuse the `group` value the rest of the tutorial uses so the reader's selection persists
- **Code changes** → `<Diff before={...} after={...}>` (not two consecutive fences)
- **Optional solutions / spoilers** → `<Hint>` (collapsible) or `<Reveal>` (click-to-show)
- **Architecture / sequence / flow** → `<Mermaid>` or a ` ```mermaid ` fence
- **Embeddable video** → `<Embed url="..."/>`; **downloadable asset** → `<Download href="/downloads/..."/>`
- **Runnable JS/TS** → `<Playground>` (v1: JS/TS only)
- **Knowledge check** → `<Quiz>` — useful mid-tutorial or when introducing a tricky concept
- **End-of-step summary** → `<Recap items={[...]}/>` — **every step**
- **Progress gate** → `<Checkpoint label="..."/>` — **every step, before the `<Recap>`, when the tutorial is `gated: true`**

The full prop signatures live in `AGENTS.md` under "MDX components".

Show the author your component picks for the step (one line) and confirm before scaffolding:

> Step `04-deploy-to-render.mdx`: `<Tabs group="pkg">` (same as previous steps), `<Terminal>` for the deploy command, `<Checkpoint>` (tutorial is gated), `<Recap>`.

## 4. Scaffold the step file

Slugify the step title (`deploy-to-render`, kebab-case). The filename is `<NN>-<step-slug>.mdx` in the tutorial folder. Verify the prefix doesn't already exist.

Write frontmatter and a useful skeleton — not just a `<Callout>`. Drop in *empty* instances of the components agreed in section 3 (only the ones for *this* step). Strip the comment hints below before saving — they're guidance, not output:

```mdx
---
title: <Step title>
duration: <e.g. 5 min>
summary: <One-line teaser; surfaces on the landing page and in AI context>
---

In this step you'll <one sentence describing the step's outcome>.

<Callout type="info">
<What the reader should have ready, or what they did in the previous step.>
</Callout>

## <First section heading>

{/* TODO(author): write the body of this step */}

{/* Drop in the components agreed in section 3, e.g.: */}
{/* <FileTree paths={[]} /> */}
{/* <Tabs group=""><Tab label="">…</Tab></Tabs> */}
{/* <Terminal entries={[{ command: "", output: "" }]} /> */}
{/* <Diff before={``} after={``} /> */}
{/* <Quiz question="" options={[]} answer={0} explanation="" /> */}

<Checkpoint label="I did <thing>." />

<Recap items={[
  "<bullet>",
  "<bullet>",
]} />
```

Omit the `<Checkpoint>` line if the tutorial is *not* gated. Keep `<Recap>` always.

## 5. Keep `_meta.json` honest

If `_meta.json.estimatedDuration` is set, update it. Sum the `duration` values across all step frontmatters (including the new one) and round to a sensible value (`"20 min"`, `"45 min"`, `"1 hr"`). If the field isn't set, leave it alone — it's auto-summed at build time.

Do **not** touch `title`, `description`, `tags`, `difficulty`, or `prerequisites` here — that's not what `add-step` is for. If the new step changes the tutorial's overall scope, mention it and ask the author whether they want to update those fields separately.

## 6. Hand off

Tell the author exactly what to do next:

1. **Run `pnpm dev`** and open `http://localhost:4321/<tutorial-slug>/<step-slug>` to see the scaffold.
2. **Write the body**, then replace the empty component placeholders with real content.
3. **Companion skills** for the components they picked:
   - `add-quiz`, `add-checkpoint`, `add-playground`, `add-mermaid-diagram`
4. When the tutorial feels done, run `review-tutorial` — the pre-publish checklist.

## Don't

- Don't pick a numeric prefix that collides with an existing step. Verify with `ls` before writing.
- Don't forget the `<Checkpoint>` when the tutorial is `gated: true`. Without it, the reader can't advance past this step.
- Don't ship prose-heavy steps. If a step has 3+ paragraphs of running text without a component, you're using the wrong tool — reach for `<FileTree>`, `<Diff>`, `<Terminal>`, `<Tabs>`, or `<Playground>`.
- Don't reach for a fenced code block when a component fits better. A bash fence with `$` prompts should be `<Terminal>`; a list of file paths should be `<FileTree>`; before/after code should be `<Diff>`.
- Don't `import` MDX components — they're globally registered.
- Don't renumber existing step files unless the author explicitly asks. Use an alphabetic suffix (`02a-`) to insert between steps.
- Don't change `_meta.json` fields other than `estimatedDuration`. Scope creep — use a separate edit for that.
- Don't pick a `<Tabs group="...">` value that disagrees with the rest of the tutorial. Selection persistence relies on a stable group key.

## Shortcut

For authors who already know the step's purpose, placement, and components, run:

```bash
pnpm handzon:step
```

This prompts for the tutorial, title, and duration, then writes a minimal stub (frontmatter + `<Callout>` + `<Recap>`). The author then fills in components by hand or with `add-quiz`/`add-checkpoint`/etc. Use this path when the author explicitly says they don't need the planning step.
