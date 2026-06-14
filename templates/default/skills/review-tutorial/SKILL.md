---
name: review-tutorial
description: Pre-publish editorial pass for a Handzon tutorial. Runs mechanical anti-pattern checks (grep), structural checks (gating, recap, quiz coverage), content checks (component fit, prose-heavy detection), and reports findings grouped by severity.
triggers: ["review", "review tutorial", "edit pass", "publish check", "audit tutorial", "pre-publish", "qa tutorial"]
---

Use this before merging or publishing a tutorial. The goal is to catch the silent failure modes (gating bugs, drifted ids, anti-patterns) before a reader hits them, then surface a focused fix list — not to rewrite the tutorial.

If the author asks for a quick sanity check, do sections 1–3 and stop. The full pass (sections 1–6) is for "we're about to ship this".

## 1. Read the tutorial first

Before checking anything, load the whole thing into your head:

1. **Pick the tutorial.** If unclear, list folders under `src/content/tutorials/` and ask.
2. **Load `<slug>/_meta.json`.** Note: `gated`, `estimatedDuration`, `difficulty`, `prerequisites`, `nextTutorial`, and `starter`. The gated flag drives most of section 3.
3. **List the step files** (`ls <slug>/*.mdx`) and read each top-to-bottom.
4. **Check for orphan assets** — files under `<slug>/assets/` that no step references.

Keep a running list of findings as you go. Don't fix anything yet; you'll group findings by severity in section 6.

## 2. Mechanical checks (run these first)

These are grep-able anti-patterns. Run them from the repo root; pipe them into the findings list.

```bash
# 2a. Leftover TODOs/FIXMEs/XXX/scaffold markers in the tutorial body.
rg -n "TODO\(author\)|TODO|FIXME|XXX" src/content/tutorials/<slug>/

# 2b. MDX `import` statements — components are globally registered; imports are always wrong.
rg -n "^import\s" src/content/tutorials/<slug>/

# 2c. Bash fences with $ prompts — these should be <Terminal> instead.
rg -n '^\$ ' src/content/tutorials/<slug>/ -g '*.mdx'

# 2d. Two consecutive fenced code blocks (likely a missed <Diff> opportunity).
rg -nP '^```\w+\n(.+\n)+```\n\n```\w+' --multiline src/content/tutorials/<slug>/

# 2e. Hardcoded color/radius/font values — should use theme tokens.
rg -n "style=\{\{[^}]*(color|background|borderRadius|fontFamily)" src/content/tutorials/<slug>/
```

Then run the build:

```bash
pnpm check   # Astro + TS errors
```

If anything from 2a–2e or `pnpm check` fails, it's a **must fix** finding.

## 3. Structural checks

For each step, verify:

- **Frontmatter** — `title` is present. `duration` and `summary` are optional but recommended.
- **Ends with `<Recap items={[...]}/>`.** Missing recap is a must-fix.
- **First step sets context.** Step 1's first sentence should orient the reader ("In this step you'll …"). No code in step 1; that belongs in step 2+.
- **Last step is the payoff.** Whatever the anchor artifact is — running, deployed, tested. If the last step is conceptual recap instead of action, the tutorial buries the lede.

For the tutorial as a whole:

- **At least one `<Quiz>`.** Tutorials without a comprehension check feel like blog posts.
- **`_meta.json.estimatedDuration` matches the sum of step `duration` values** (or is omitted entirely — auto-summed at build). If set and drifted, flag for fix.
- **`prerequisites` is honest.** If step 1 assumes Docker but `prerequisites` doesn't list it, that's a barrier you can't see from the inside.
- **Starter metadata matches step 1.** If the first step tells the learner to clone a repo, run `npm create`, run `pnpm create`, or scaffold an app, `_meta.json.starter` should exist so MCP-aware agents can start from a blank workspace. If `starter` exists, confirm its `targetDir`, `openPath`, and commands match the first step.

### 3a. Gated-tutorial audit (only if `_meta.json.gated: true`)

This is the highest-impact section. The gating mechanic requires **both** `gated: true` *and* at least one completion item (`<Quiz>` or `<Checkpoint>`) per step. A step with no completion item silently un-gates itself — no build error.

```bash
# Find every step file that lacks a Quiz or Checkpoint.
for f in src/content/tutorials/<slug>/*.mdx; do
  rg -q '<(Quiz|Checkpoint)' "$f" || echo "MISSING COMPLETION ITEM: $f"
done
```

Then within gated tutorials, audit:

- **Every completion item on a step composes.** A step with two quizzes and one checkpoint completes only when both quizzes are correct and the checkpoint is done. Flag accidental extra items.
- **Every `<Checkpoint>` has an explicit `id`.** Default ids include React's positional `useId`, so inserting any MDX component above a checkpoint invalidates the reader's previous completion. Find checkpoints missing `id`:

```bash
rg -nP '<Checkpoint(?![^>]*\bid=)' src/content/tutorials/<slug>/
```

- **Every `<Quiz>` has an explicit `id`.** Same drift problem:

```bash
rg -nP '<Quiz(?![^>]*\bid=)' src/content/tutorials/<slug>/
```

- **Gated step has `<Checkpoint>` but no `verify.checks`** (Family D soft warning, not a must-fix). If the step's outcome is machine-observable (file landed, command exited 0, port responds), declaring a `verify` block in frontmatter lets an agent on the learner's machine tick the checkpoint deterministically. Prose-fallback (label-only `<Checkpoint>`) still works — it's the author's call. Flag for **consideration**, not as a blocker.

```bash
# Steps with a Checkpoint but no `verify:` block in frontmatter.
for f in src/content/tutorials/<slug>/*.mdx; do
  if rg -q '<Checkpoint' "$f" && ! rg -q '^verify:' "$f"; then
    echo "PROSE-ONLY VERIFICATION: $f"
  fi
done
```

When you flag these, suggest the `add-verify-checks` skill to the author. Don't flag visual-only outcomes ("the chart looks right") — those genuinely belong in prose-fallback land.

## 4. Content & component-fit checks

A tutorial that's mostly prose underuses the platform. For each step, scan for these anti-patterns:

- **Prose-heavy step.** 3+ consecutive paragraphs of running text with no component is a smell. The fix is *not* to add a `<Callout>` for show — it's to reach for the component that actually fits (`<FileTree>`, `<Diff>`, `<Terminal>`, `<Tabs>`, `<Playground>`).
- **Code fence anti-patterns:**
  - Bash fence with `$` prompts → should be `<Terminal entries={[{command, output}]}>`.
  - Code fence listing file paths with slashes → should be `<FileTree paths={[...]}/>`.
  - Two consecutive fences showing before/after → should be `<Diff before={...} after={...}/>`.
- **Code fences missing `title="..."`** when the file matters. Without a filename, the reader doesn't know where to paste it.
- **Multi-platform commands without `<Tabs group="...">`.** npm/pnpm/yarn variants, mac/linux/windows, SQLite/Postgres — these need tabs so the reader's selection persists across steps. Also check the `group` value is consistent across the tutorial (a tutorial that uses `group="pkg"` in step 2 and `group="package-manager"` in step 4 loses persistence).
- **No step longer than ~10 minutes of reading.** Sum the `duration` frontmatter; flag anything >10. Suggest splitting.
- **`<Quiz>` quality:**
  - Every Quiz has an `explanation`. The explanation is the most valuable part; missing is a must-fix.
  - No "all of the above" or "none of the above" options — quiz anti-patterns.
  - Distractors should be plausible misconceptions, not jokes.
- **`<Checkpoint>` quality:**
  - Labels are first-person, present-tense, sensory-verifiable. Reject `"I understand X"` and `"This makes sense"` — not verifiable.
  - One claim per checkpoint.

### 4a. Voice and MDX-safety audit

Run the `authoring-voice` skill against every step body. It covers punctuation (no em dashes), MDX traps that break the build, AI tells to cut, voice/POV conventions, and word-choice defaults. Three of those are mechanical and worth grepping for here:

```bash
# Em dashes. Banned outright.
rg -n "—" src/content/tutorials/<slug>/

# Backslash-escaped quotes in JSX attributes. These break the build with
# "Unexpected character `\` in attribute name".
rg -n '\\"' src/content/tutorials/<slug>/

# Common AI tells.
rg -nP "\b(let's dive in|in this section, we'll|it's important to note|it's worth mentioning|leverage|utilize|delve into|comprehensive|robust|seamless|elegant|powerful|in conclusion|to wrap up|imagine a world)\b" src/content/tutorials/<slug>/ -i
```

Em-dash hits and `\"` hits are both **must fix**. AI-tell hits are **recommended** unless they're inside a code block or quoted external content, in which case ignore. Anything `pnpm check` flags as an MDX error is also must-fix, by definition.

## 5. Polish

- **No `TODO`, `XXX`, `FIXME`, or `TODO(author)`** anywhere in step bodies. Covered by 2a but worth a second pass after fixes.
- **All co-located assets are referenced.** `ls <slug>/assets/` and grep each filename in the tutorial; orphans should be deleted or used.
- **Tutorial media resolves.** If `_meta.json.cover`, `_meta.json.icon`, `author.avatar`, or step `heroMedia` references a local file, verify the file exists.
- **AI references resolve.** If `_meta.json.ai.references` lists files, verify each exists.
- **AI sanity (only if `_meta.json.ai.enabled` is true or omitted).** See section 5a below.
- **Manual click-through.** Run `pnpm dev`, open `http://localhost:4321/<slug>`, click Next through every step. Confirm:
  - Gated tutorials: Next disables until the checkpoint is toggled, then enables.
  - Tabs remember selection across steps.
  - All embeds/playgrounds actually load.
  - Mermaid diagrams render.

### 5a. AI assistant audit

Skip this whole section if `_meta.json.ai.enabled` is explicitly `false`. Otherwise the tutor is live and worth a sanity pass — most failure modes here are silent (no build error, just bad UX).

Read `_meta.json.ai` and confirm:

- **Persona matches surface text.** If `greeting` says "I'm Postgrid, your SQL pair" but `name` is `"Helper"` or unset, the chat header and the greeting disagree. Either match them or drop the greeting.
- **Tone fits the audience.** Beginner tutorials usually want `socratic` or `encouraging`; advanced reference tutorials usually want `direct`. Flag a mismatch with `difficulty`.
- **`disabledSkills` names are real.** Each entry must match a `name` in `packages/ai/src/skills.ts`. Typos silently do nothing — there's no build-time validation.

```bash
# List the disabledSkills entries (jq optional; eyeball them otherwise).
jq -r '.ai.disabledSkills // [] | .[]' src/content/tutorials/<slug>/_meta.json
# Cross-check against the real names.
rg -n '^\s*name:' packages/ai/src/skills.ts
```

- **`disabledSkills` matches reality.** If the tutorial has no `<Playground>`, `review-my-code` is doing nothing useful — flag for consideration. If it's not `gated: true`, `help-with-checkpoint` is dead weight. If the tutorial has no local install steps, `debug-environment` should usually go.
- **BYOK matches deployment intent.** If `byok` is `"optional"` or `"disabled"`, confirm with the author that the corresponding provider env var (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, etc.) will be set in production. Wrong setting + missing key = a chat panel that silently demands the learner paste their own key.
- **`includeFutureSteps` is intentional.** Default `false` (no spoilers). If it's `true`, the tutorial should be reference-style or a recipe collection — flag otherwise.
- **`<HelpMe />` placement.** Inline `<HelpMe />` and the global `autoStepHelp` footer can stack visually. If `autoStepHelp` is on in `src/config/ai.ts`, flag any step whose final non-`<Recap>` component is `<HelpMe />`:

```bash
# Steps that end with <HelpMe /> right before <Recap> — likely stacking with autoStepHelp.
rg -nP '<HelpMe[^>]*/>\s*\n+\s*<Recap' src/content/tutorials/<slug>/
```

- **`<HelpMe topic="...">` is specific.** Grep for generic topics and flag them:

```bash
rg -nP '<HelpMe[^>]*topic="(this|this part|this step|the above|above)"' src/content/tutorials/<slug>/
```

- **AI references budget.** Sum the byte counts of files listed in `ai.references`. The runtime budget is `aiDefaults.contextBudgetTokens` (8000 tokens by default; ~32 KB of text). If references comfortably exceed that, the assistant will see a truncated view — flag for trimming or splitting.
- **MCP starter sanity.** If `_meta.json.starter` exists, call or inspect `start_tutorial` for this slug and confirm the returned commands are local-only, safe to run from a blank workspace, and point at the real first step.

## 6. Report findings

Group everything into three buckets. Be honest about what's must-fix vs. taste.

**Must fix before publish:**
- Build errors (`pnpm check`)
- Missing `<Quiz>` or `<Checkpoint>` in any step of a gated tutorial
- Missing `<Recap>` in any step
- MDX `import` statements
- Quiz with no `explanation`
- Unverifiable Checkpoint labels (`"I understand X"`)
- Em dashes anywhere in step bodies (see `authoring-voice`)
- Backslash-escaped quotes (`\"`) inside JSX attributes (breaks the build)
- Anything that breaks the click-through in section 5
- Leftover `TODO(author)` markers
- AI references that don't resolve to real files
- `disabledSkills` entries that don't match a real skill name (silent no-op)
- `byok: "optional"` or `"disabled"` without a corresponding provider env var planned in production

**Recommended:**
- Component-fit fixes (bash → `<Terminal>`, file lists → `<FileTree>`, before/after → `<Diff>`)
- AI-tell phrasing flagged by section 4a (`leverage`, `utilize`, `let's dive in`, etc.)
- Adding explicit `id`s to Checkpoints and Quizzes in gated tutorials
- Adding `verify.checks` to gated steps with machine-observable outcomes (see `add-verify-checks`)
- Adding `_meta.json.starter` when step 1 clones, scaffolds, or initializes a project (see `wire-tutorial-starter`)
- Splitting steps longer than 10 minutes
- Fixing `estimatedDuration` drift
- Adding `<Tabs group="...">` for multi-platform variants
- Persona / tone / greeting misalignment in `_meta.json.ai` (see `configure-ai-assistant`)
- `disabledSkills` that doesn't match the tutorial's shape (e.g. `review-my-code` enabled with no `<Playground>`)
- Inline `<HelpMe />` stacking with the global `autoStepHelp` footer
- Generic `topic=""` strings on `<HelpMe />`
- `ai.references` collectively exceeding `contextBudgetTokens`

**FYI (not blocking):**
- Missing optional cover, icon, author avatar, or step hero media
- Style/voice nits
- Suggestions for additional Quizzes or Playgrounds
- `includeFutureSteps: true` on a story-arc tutorial (verify it's deliberate)

Present the report grouped this way. **Don't auto-fix without asking** — the author may have reasons for some choices (e.g. deliberately keeping a step prose-heavy because it's a conceptual interlude). Surface the findings, propose fixes for the must-fix bucket, and ask before applying recommendations.

## Don't

- Don't rewrite the tutorial. This is a review, not a rewrite. Surface findings, propose fixes, ask first.
- Don't auto-fix must-fix issues without showing the author what changed. Build errors and missing checkpoints get a fix proposal, not a silent edit.
- Don't require optional media. Do flag broken media paths when the tutorial sets them.
- Don't pad the report. If the tutorial is clean, say so in one line. A 30-finding report on a 4-step tutorial means most findings are taste.
- Don't skip section 3a on gated tutorials. The silent-skip bug is the single most common production issue.
- Don't skip section 5a if the tutorial has the assistant enabled. Most AI failure modes here are silent (no build error, just bad learner UX).
