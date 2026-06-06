---
name: add-tutorial
description: Plan, scaffold, and wire up a new Handzon tutorial. Interviews the author, proposes a step outline, then creates the folder, _meta.json, and per-step .mdx files populated with usable skeletons.
triggers: ["add tutorial", "new tutorial", "create tutorial", "scaffold tutorial", "draft tutorial", "start tutorial"]
---

Use this when the author wants to start a new tutorial from scratch. The hard part isn't the folder structure — it's deciding what the tutorial is and how to break it into steps. Do that first, *then* scaffold.

If the author already has a clear outline and just wants empty files, point them at the shortcut at the bottom and stop.

## 1. Interview the author (one question per turn)

Skip any question the author has already answered. Otherwise ask them in order, one at a time, using multiple choice where possible:

1. **Audience** — beginner, intermediate, or advanced? This sets `difficulty` and the tone of step 1.
2. **Learning outcome** — finish the sentence: *"By the end of this tutorial, the reader can ___."* Single concrete capability. If they give you something vague ("learn about X"), push back once and ask for the action verb.
3. **Anchor artifact** — what will the reader have *built* or *done* by the end? A running app, a passing test suite, a deployed service, a query they wrote? This becomes the title of the final step.
4. **Target length** — ~10 min (3 steps), ~20 min (4–5 steps), or ~40 min (6+ steps)?
5. **Workspace start** — blank workspace, starter repo, or create-app command? If the tutorial should work from Cursor, Claude Code, Codex, or another MCP-aware agent, use `wire-tutorial-starter` after the outline is approved.

Optionally ask about prerequisites and tags only if they aren't obvious from the answers above.

## 2. Propose an outline

Before touching the filesystem, draft a step plan and show it to the author. Each step gets:

- A numeric prefix (`01-`, `02-`, …)
- A short title (becomes the step's `title` and URL slug)
- A one-line purpose

Guidance:

- **Step 1 always sets the stage.** Context, what they'll build, what they need installed. Never code in step 1.
- **The last step is the payoff.** Whatever the anchor artifact is — running, deployed, tested.
- **Aim for ~5 min of reading per step.** Split anything longer.

**Match each step to components.** The platform's value is interactive tutorials — a prose-heavy step is the most common failure mode for new authors. As you propose each step, also propose which components it will use. Common mappings:

- **Showing project / folder structure** → `<FileTree paths={[...]}>` (not a code fence with slashes)
- **Showing a command and its output** → `<Terminal entries={[{command, output}]}>` (not a fenced bash block)
- **Variants** (npm/pnpm/yarn, mac/linux/windows, SQLite/Postgres) → `<Tabs group="...">` so the reader's choice persists across steps
- **Code changes** → `<Diff before={...} after={...}>` (not two consecutive fences)
- **Optional solutions / spoilers** → `<Hint>` (collapsible) or `<Reveal>` (click-to-show)
- **Architecture / sequence / flow** → `<Mermaid>` (interactive) or a ` ```mermaid ` fence (static)
- **Opening screenshot or walkthrough video** → `heroMedia` in step frontmatter
- **Inline embeddable video** → `<Embed src="..."/>`; **downloadable asset** → `<Download href="/downloads/..."/>`
- **Runnable JS/TS** → `<Playground>` (v1: JS/TS only)
- **Knowledge check** → at least one `<Quiz>` per tutorial, typically mid-tutorial
- **Inline "stuck?" button** → `<HelpMe topic="..."/>` at a specific hard spot in a step when the tutorial has AI enabled (see `add-helpme`)
- **Progress gate** → `<Checkpoint label="..."/>` at the end of every step when `gated: true`
- **End-of-step summary** → `<Recap items={[...]}/>` on every step

The full prop signatures live in `AGENTS.md` under "MDX components" — refer to it, don't restate it.

Annotate each step in the outline with the components you plan to use, e.g.:

> **2. `02-write-the-query.mdx`** — author's first SELECT
> Components: `<Tabs group="db">` (SQLite / Postgres), `<Diff>` (empty → finished query), `<Quiz>`, `<Recap>`

Present the outline and ask: *"Want me to scaffold this, or adjust the steps or component choices first?"* **Do not scaffold until the author approves.**

## 3. Scaffold from the approved outline

Slugify the title (`my-cool-tutorial`, kebab-case, no numeric prefix). Verify the slug doesn't already exist under `src/content/tutorials/` — if it does, ask the author for a different one.

Then create:

```
src/content/tutorials/<slug>/
├── _meta.json
├── 01-<step-slug>.mdx
├── 02-<step-slug>.mdx
└── ...
```

**`_meta.json`** — fill in everything you learned from the interview, don't leave stubs:

```json
{
  "title": "<Title from author>",
  "description": "<One sentence from the learning outcome>",
  "difficulty": "beginner | intermediate | advanced",
  "tags": ["<tag>", "<tag>"],
  "estimatedDuration": "<sum of step durations, e.g. '20 min'>",
  "prerequisites": ["<prereq>", "<prereq>"]
}
```

Add `"gated": true` only if the author asked for it. If the author provides cover art or an icon, set `cover` and `icon` so cards, landing pages, and social previews can use them. If the author chose a starter repo or create-app command, add a `starter` block using `wire-tutorial-starter` so MCP-aware agents can start the tutorial from a blank workspace. See `AGENTS.md` for the full schema (`nextTutorial`, `cover`, `icon`, `ai`). For per-tutorial AI assistant overrides (`ai.tone`, `ai.persona`, `ai.byok`, `ai.disabledSkills`, etc.), defer to the `configure-ai-assistant` skill — don't stub the block here, it inherits sensible defaults from `src/config/ai.ts` until the author has an opinion.

**Each step `.mdx`** — frontmatter plus a useful skeleton, not just a `<Callout>` placeholder. Drop in empty instances of the components the outline agreed on for *this* step (don't include components from other steps). Any prose you write in the skeleton (the intro sentence, the `<Callout>` body) must follow the `authoring-voice` rules — no em dashes, no AI tells, second person, present tense:

```mdx
---
title: <Step title from outline>
duration: <e.g. 5 min>
summary: <One-line teaser>
---

In this step you'll <one sentence describing the step's outcome>.

<Callout type="info">
<What the reader should have ready before starting this step.>
</Callout>

## <First section heading>

{/* TODO(author): write the body of this step */}

{/* Drop in the components this step needs, e.g.: */}
{/* <FileTree paths={[]} /> */}
{/* <Tabs group=""><Tab label="">…</Tab></Tabs> */}
{/* <Diff before={``} after={``} /> */}
{/* <Quiz question="" options={[]} answer={0} explanation="" /> */}

<Recap items={[
  "<bullet>",
  "<bullet>",
]} />
```

Append `<Checkpoint label="I did <thing>." />` *before* the `<Recap>` only if the tutorial is gated. Replace the comment hints with the actual empty components from the outline — don't leave the comments behind.

**`src/content/tutorials/_index.json`** — append the new slug to the `order` array. Create the file with `{ "order": ["<slug>"] }` if it doesn't exist. Without this, the tutorial still renders but appears at the bottom of the homepage sorted alphabetically.

## 4. Hand off

Tell the author exactly what to do next, in this order:

1. **Run `pnpm dev`** and open `http://localhost:4321/<slug>` to see the scaffold.
2. **Write step 1 first** — it's the easiest and unblocks the mental model for the rest.
3. **Cover art is schema-only for now.** `_meta.json.cover` and `icon` are accepted by the schema but no page renders them yet. Don't promise the author it'll show up on tutorial cards or OG meta — it won't. Mention it as forward-compatible scaffolding only if they ask.
4. **Companion skills** they'll likely want next:
   - `authoring-voice` — Handzon's house voice rules (no em dashes, no AI tells, etc.). Invoke before writing any prose.
   - `add-step` — if the outline grows
   - `add-quiz` — to add the mid-tutorial quiz
   - `add-checkpoint` — for gated tutorials
   - `add-playground`, `add-mermaid-diagram`, `add-helpme` — interactive blocks
   - `configure-ai-assistant` — shape the tutor's tone, persona, BYOK, disabled skills for this tutorial
   - `wire-tutorial-starter` — make MCP-aware agents clone or initialize the learner workspace
   - `wire-ai-references` — feed the AI assistant external docs
   - `review-tutorial` — the pre-publish checklist

## Don't

- Don't scaffold before the outline is approved. This is the most common failure mode.
- Don't write the body content for the author — write skeletons with TODOs. They know their material better than you do.
- Don't ship prose-heavy steps. If a step has 3+ paragraphs of running text with no component, you're using the wrong tool — reach for `<FileTree>`, `<Diff>`, `<Terminal>`, `<Tabs>`, or `<Playground>`.
- Don't reach for a fenced code block when a component fits better. A bash fence with `$` prompts should be `<Terminal>`; a list of file paths should be `<FileTree>`; before/after code should be `<Diff>`.
- Don't skip `_index.json`. The tutorial won't be in homepage order without it.
- Don't pick a slug that collides with an existing folder under `src/content/tutorials/`.
- Don't put numeric prefixes on the tutorial folder name — prefixes are for *step* files only.
- Don't `import` MDX components — they're globally registered.

## Shortcut

For authors who already have a clear outline and want bare scaffolding without the interview, run:

```bash
pnpm handzon:new
```

This handles steps 1, 3 (a single `01-introduction.mdx` stub), and the `_index.json` append interactively. The author then runs `pnpm handzon:step` per step. Use this path when the author explicitly says they already know the structure.
