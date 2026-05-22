---
name: add-checkpoint
description: Write a verifiable `<Checkpoint>` that gates progress to the next step. Covers the gating mechanic, what makes a checkpoint actually verifiable, the one-checkpoint-per-step rule, and stable ids.
triggers: ["add checkpoint", "checkpoint", "gate step", "verifiable check"]
---

Use this when the author wants the reader to confirm they actually *did* something before moving on. A `<Checkpoint>` is what turns a tutorial from "read this" into "do this, then prove it".

## 1. How gating actually works

Read this first or the failure mode in section 2 won't make sense.

The Next button at the bottom of a step is disabled only when **both** conditions hold:

1. The tutorial's `_meta.json` has `"gated": true`, **and**
2. The current step contains at least one `<Checkpoint>` (detected at build time).

When both hold, toggling *any* checkpoint on that step calls `markStepComplete(tutorial, step)` and the Next button unlocks. The framework code lives in `StepNav.astro`'s `<script>` block — `data-gated="true"` is set per step based on `hasCheckpoint`.

The crucial implication: **a step that should be gated but has no `<Checkpoint>` is silently un-gated.** No build error, no warning — the reader just sails past without doing the work. This is the most common gating bug.

## 2. Decide if a checkpoint belongs here

Add a checkpoint when:

- The tutorial is `gated: true` and this step asks the reader to *do* something. (The reader shouldn't be able to skip the work.)
- The step has a concrete, verifiable outcome the reader should pause and confirm.

Skip the checkpoint when:

- The step is read-only (concept explanation, recap). Forcing the reader to click a box on a step where they didn't do anything is friction without value.
- The tutorial is not gated. The checkpoint will still render but won't gate anything; if you want a "did you do it?" affordance without gating, that's fine, but be intentional.

## 3. Write a verifiable label

The label is a **first-person, present-tense, sensory-verifiable** claim. The reader should be able to look at their screen, terminal, or filesystem and say "yes" without ambiguity.

Good:

- `"My dev server is running and the browser shows the Vite welcome screen."`
- `"I see two TODOs in the list."`
- `'My API responds to `curl localhost:8000/healthz` with `{"status":"ok"}`.'` (note the **outer single quotes** so the inner double quotes don't need escaping — `\"` inside an MDX attribute breaks the build)
- `` "`pnpm test` reports 3 passing tests." ``

Bad:

- `"I understand how `useState` works."` — not verifiable, no observable evidence.
- `"I've completed this step."` — tautological.
- `"This makes sense."` — empty.
- `"I read the docs."` — not part of *this* tutorial's work.

Rules:

- **Show me, don't tell me.** Name the file, the command output, the screen, the number.
- **First person, present tense.** "I see", "My X is", "`X` returns".
- **One claim per checkpoint.** "I see the list AND my server is running" should be two checkpoints — or, better, one combined checkpoint named after the user-visible outcome.
- **Reference concrete artifacts.** Filenames, command output, URL paths — anything the reader can point at.

## 4. One effective checkpoint per step

The component calls `markStepComplete` on **every** toggle. So in a step with three checkpoints, toggling *any one* of them marks the whole step complete. The other two become decorative.

Practical rules:

- **One checkpoint per step is the standard.** Place it at the bottom, immediately before `<Recap>`.
- If you have multiple things the reader should verify, write **one combined checkpoint** that covers the final user-visible outcome.
- If you genuinely need intermediate verifications (rare), use `<Callout type="tip">` blocks with "You should now see X" text — those are advisory, not gating.

## 5. Placement

```mdx
{/* body of the step */}

## Verify it

{/* a sentence or two telling the reader what to look for */}

<Checkpoint label="My dev server is running and the browser shows the Vite welcome screen." />

<Recap items={[
  "Installed dependencies with pnpm",
  "Ran the dev server",
]} />
```

- **Bottom of the step, before `<Recap>`.**
- Optionally lead in with a short "Verify it" subsection explaining what success looks like — the checkpoint becomes the click-confirmation, not the only signal.

## 6. Use a stable `id` for gated tutorials

The default checkpoint id is `checkpoint:<react-id>:<label-prefix>`. The `react-id` portion is positional, so if the author later inserts an MDX component (another checkpoint, a quiz, anything that uses `useId`) above this one, the id shifts and the reader's previous completion is lost.

For gated tutorials, pass an explicit `id`:

```mdx
<Checkpoint id="setup/dev-server-running" label="My dev server is running and the browser shows the Vite welcome screen." />
```

Use `<step-area>/<concrete-outcome>` slug. Stable, won't collide, survives content edits.

## 7. Don't

- Don't ship a gated tutorial with steps that have no `<Checkpoint>`. Gating fails silently for those steps. Use `review-tutorial` to audit before publishing.
- Don't write vague labels (`"I understand X"`, `"This makes sense"`). They add friction without verification.
- Don't put more than one checkpoint per step. The first toggle marks the step complete; the rest are decorative.
- Don't place the checkpoint at the top of a step. The reader hasn't done anything yet.
- Don't place the checkpoint *after* `<Recap>`. Recap is the end-of-step summary; the checkpoint is the gate.
- Don't omit `id` in gated tutorials. Default positional ids drift when content is reordered.
- Don't `import` Checkpoint — it's globally registered like every other MDX component.
- Don't ask the reader to verify something the step didn't teach them to do. Checkpoints test the step's own work.
- Don't escape quotes inside the `label` attribute with `\"`. MDX attribute strings don't support C-style escapes and the build will fail. Use outer single quotes (`label='...{"x":1}...'`) or a JSX expression. See `authoring-voice` section 2.
