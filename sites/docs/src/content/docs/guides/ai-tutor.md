---
title: AI Tutor
description: Configure the in-browser tutor, BYOK behavior, references, and anti-spoiler rules.
---

Handzon can include an AI tutor beside tutorial steps. The tutor is powered by the generated `handzon-ai` service and uses Mastra under the hood.

## Enable or tune the tutor

Set per-tutorial AI options in `_meta.json`:

```json
{
  "ai": {
    "enabled": true,
    "tone": "socratic",
    "references": ["./refs/cheatsheet.md"],
    "byok": "required",
    "disabledSkills": ["compare-approaches"]
  }
}
```

Defaults live in `src/config/ai.ts` in the generated project.

## Fields

`enabled`
: Turns the tutor on or off for the tutorial.

`tone`
: Adjusts the tutor's teaching style. Examples: `encouraging`, `direct`, `socratic`.

`references`
: Adds tutorial-relative reference files to the assistant context.

`byok`
: Controls bring-your-own-key behavior. Use `required` when learners must provide their own model key.

`disabledSkills`
: Removes tutor abilities that do not fit the tutorial.

## References

Use references for background material the tutor should know but the learner does not need to read directly:

```text
src/content/tutorials/react-todo/
├── _meta.json
├── 01-setup.mdx
└── refs/
    └── architecture.md
```

```json
{
  "ai": {
    "references": ["./refs/architecture.md"]
  }
}
```

Keep reference files short and concrete. The tutor should receive facts, constraints, and examples, not a second copy of the entire tutorial.

## Anti-spoiler rule

The default system prompt tells the tutor:

- Do not reveal quiz answers directly.
- Nudge before giving full checkpoint solutions.
- Prefer the current step's context.
- Ask clarifying questions when the learner's state is unclear.

If you override the system prompt, preserve these rules.

## Deployment

The lightweight Render Blueprint can deploy the optional AI service without Postgres. The full Blueprint also supports sign-in and server-side learner records.

If a tutorial uses BYOK, learners store their model key in their browser. Do not ask learners to paste provider keys into tutorial content or progress fields.
