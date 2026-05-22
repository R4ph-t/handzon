---
name: add-helpme
description: Drop a "Stuck? Ask the tutor" button inline in a step, or rely on the global auto step-help footer. Use when an author wants to offer an AI-assisted escape hatch at a specific point in a step rather than only at the end.
triggers: ["helpme", "help me", "stuck button", "ai help button", "ask the tutor", "auto step help"]
---

`<HelpMe />` is an MDX-level button that opens the in-app tutor pre-seeded with an "I'm stuck" intent. It only renders when `aiConfig.enabled` is true on the host tutorial — if AI is off, it's a no-op.

## When to use inline `<HelpMe />`

Drop it inline when there's a specific point in a step that's hard, and you want the escape hatch right there rather than at the end. Common spots:

- After a complex `<Diff>` where the change is non-obvious.
- After a `<Terminal>` block whose output the reader has to interpret.
- Between a concept and the exercise that depends on it.
- Just before a `<Checkpoint>` learners commonly get stuck on.

If you find yourself wanting `<HelpMe />` at the *end* of every step, you don't want this component — you want `autoStepHelp` (see below).

## Props

```mdx
<HelpMe topic="the regex in the matcher" label="Stuck on the regex?" />
```

- **`topic`** *(optional)* — string appended to the seed message ("I'm stuck on …"). Be specific. `"the regex in the matcher"` gives the tutor enough to anchor on; `"this part"` doesn't.
- **`label`** *(optional)* — overrides the button text. Default is `"Stuck on {topic}?"` when `topic` is set, `"Stuck? Ask the tutor"` otherwise. Override only when the default reads awkwardly.

Both props are optional. `<HelpMe />` with nothing is valid — it just produces a generic stuck-on-this-step prompt.

## Placement rules

1. **One inline `<HelpMe />` per step, max.** More than one starts to feel like begging the reader to use the tutor. If multiple sub-tasks in one step are each gnarly, you probably want to split the step.
2. **Don't put it at the end of the step.** That's what the global `autoStepHelp` footer is for — they'd stack. If your last component before `<Recap>` is `<HelpMe />`, delete it and turn on `autoStepHelp` instead.
3. **Don't put it inside a `<Hint>` or `<Reveal>`.** Defeats the point — the reader who's stuck is the one who hasn't opened the hint.
4. **Blank lines around it.** It's a JSX block; MDX prefers blank lines before and after.

## The global alternative: `autoStepHelp`

If you want a "Stuck on this step?" footer under *every* step body automatically, flip the site-level flag in `src/config/ai.ts`:

```ts
export const aiDefaults: AiConfig = {
  enabled: true,
  // ...
  autoStepHelp: true,
};
```

This renders a `<StepHelp />` island after every step's content, before the Next button. Two consequences:

- You don't need to drop inline `<HelpMe />` for the end-of-step case anymore.
- It applies *globally* to every tutorial, not per-tutorial. There's no per-tutorial override in `_meta.json.ai` for this.

Pick one model and stick with it for the site:

- **Inline `<HelpMe />` only** — surgical, author-controlled, zero footer noise on simple steps. Good for sites with mixed difficulty.
- **`autoStepHelp: true` only** — universal escape hatch, no per-step thinking required. Inline `<HelpMe />` then becomes a redundant in-page accent — avoid mixing.

## Disabled-AI behaviour

`<HelpMe />` calls `useAiEnabled()` and returns `null` when the tutorial has `ai.enabled: false`. That means you can sprinkle it into a tutorial that *might* later turn off AI without breaking the layout — it just disappears. Same for the `autoStepHelp` footer.

## Don't

- Don't write a generic `topic`. `topic="this part"` and `topic="the previous step"` are noise. Either be specific or omit the prop.
- Don't use `<HelpMe />` as a substitute for a `<Hint>`. They're different: `<Hint>` reveals author-written guidance; `<HelpMe />` opens an AI conversation. If the answer is knowable in advance, write a `<Hint>`.
- Don't put `<HelpMe />` in step 1 of a beginner tutorial unless the step has a real hard spot. Step 1 is supposed to be confidence-building; an escape hatch implies the reader will need it.
- Don't combine inline `<HelpMe />` at the end of a step with `autoStepHelp: true` enabled. The two will stack visually.
- Don't `import HelpMe` — it's a globally registered MDX component.
