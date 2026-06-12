---
title: Checkpoints and Gating
description: Use checkpoints, quizzes, and gated steps to record progress and control when learners can move on.
---

Handzon tracks learner progress with browser-local state by default. Checkpoints and quizzes write to that progress store.

## Checkpoints

A checkpoint is a self-attested "I did this" marker:

```mdx
<Checkpoint id="setup/dev-server" label="The dev server is running." />
```

Use stable ids. If you omit `id`, Handzon can still render the checkpoint, but explicit ids are required when you attach a `verify` spec.

Good checkpoint labels describe evidence the learner can observe:

- "The dev server is running at `localhost:3000`."
- "The tests pass for my selected track."
- "I can see the deployed service in the Render Dashboard."

Avoid vague labels like "I understand this."

## Gated tutorials

Set `gated: true` in `_meta.json` when learners must complete each step before continuing:

```json
{
  "gated": true
}
```

When a step contains a `Checkpoint` and the tutorial is gated, the Next link is disabled until that checkpoint is complete.

Use gating for workshops, certification paths, or tutorials where skipping ahead creates confusion. Avoid gating for reference-style docs.

## Quizzes

Use `<Quiz>` to check one concept:

```mdx
<Quiz
  question="What gates the Next button in a step?"
  options={[
    "Reading the page",
    "A Checkpoint component",
    "Time on page",
    "Nothing — it is always enabled"
  ]}
  answer={1}
  explanation="A step checkpoint gates the Next button when the tutorial has gated: true."
/>
```

Tips:

- Ask about the one idea that matters most.
- Use plausible distractors.
- Keep explanations short and corrective.
- Do not reveal quiz answers in AI assistant prompts.

## Progress behavior

Progress is local by default. With the full deployment setup, learners can sign in with GitHub and sync progress through Postgres.

Agents can also update progress over MCP when they have a token with `progress:write`.
