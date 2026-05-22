---
name: configure-ai-assistant
description: Configure the per-tutorial AI assistant — tone, persona, greeting, BYOK, disabled skills, future-step inclusion. Use when shaping how the in-app tutor behaves for a specific tutorial, not when adding reference docs (see wire-ai-references for that).
triggers: ["configure ai", "ai persona", "ai tone", "ai assistant", "tutor settings", "byok", "disable skill", "assistant config", "ai meta"]
---

The AI assistant is built on Mastra. Site-wide defaults live in `src/config/ai.ts`; per-tutorial overrides go in `_meta.json` under `"ai"`. Override only the fields you need — everything else inherits from `aiDefaults`.

Use this skill when an author wants the tutor to feel right for *this* tutorial. For wiring in external reference docs (cheatsheets, `llms.txt`), use `wire-ai-references` instead — they compose.

## 1. Decide whether the tutor belongs on this tutorial

Before tuning any knob, confirm the tutor is the right call for the content.

- **Good fit:** tutorials with non-trivial code, gating, environment setup, or concepts where learners get stuck in predictable ways.
- **Bad fit:** tutorials that are pure reading exercises (changelog walk-throughs, history pieces) or where the value of getting unstuck on your own is the whole point.

If it's a bad fit, set `"enabled": false` and stop — the rest of this skill doesn't apply. The chat button, `<HelpMe />`, and auto step help footer all check `aiConfig.enabled` and silently render nothing when it's off.

```json
{ "ai": { "enabled": false } }
```

## 2. Pick a `tone`

Three options. The choice shapes the system prompt's "CORE RULES" block.

| `tone`        | When to use                                                                                   |
| ------------- | --------------------------------------------------------------------------------------------- |
| `socratic`    | Default. Tutor asks a clarifying question before answering, nudges toward the insight. Best for tutorials where the *process* of figuring it out is the lesson. |
| `direct`      | Tutor gives concise answers with brief explanations, no clarifying questions unless blocked. Best for reference-heavy or advanced tutorials where the reader is already an expert in the broader stack. |
| `encouraging` | Warm, affirming, celebrates small wins. Same anti-spoiler rules. Best for tutorials targeting absolute beginners or audiences who are intimidated by the topic. |

Across all three: Quiz answers and Checkpoint solutions are never revealed on the first ask. That's a system-prompt invariant; you can't turn it off per tutorial.

## 3. Shape the persona (name, tagline, greeting, avatar, persona)

These are pure cosmetics over the same agent. They make a five-tutorial site feel like five distinct experiences instead of one generic chatbot.

```json
{
  "ai": {
    "name": "Postgrid",
    "tagline": "your SQL pair",
    "greeting": "Show me your query and I'll help you think about it.",
    "avatar": "./assets/postgrid-avatar.png",
    "persona": "You're a senior database engineer who's seen every bad join in the wild. You like clear table aliases and you hate `SELECT *` in production code. You're patient with newcomers but uncompromising about correctness."
  }
}
```

Field-by-field:

- **`name`** — appears in the chat panel header and the system prompt (`"You are ${name}, …"`). Keep it short. One word is best.
- **`tagline`** — single line under the name in the panel header. Skip unless it adds something the name doesn't.
- **`greeting`** — first message the panel shows when opened, before any user turn. Write it in the assistant's voice. No more than two sentences.
- **`avatar`** — image path (relative to the tutorial folder) or processed by Astro's `image()` helper. Square works best.
- **`persona`** — appended into the system prompt verbatim under a `PERSONA:` heading. This is the highest-leverage knob in this whole block. Write it as a short character sketch (2–4 sentences) in the second person. Anchor it in domain expertise plus one or two opinions. Don't override the CORE RULES (anti-spoiler, scope-to-this-step) — those live above the persona and win.

If you skip `persona`, you get a generic-but-correct tutor. That's a fine default for short tutorials.

## 4. Decide the BYOK strategy

`byok` (Bring Your Own Key) controls who pays for assistant calls.

| `byok`     | What it means                                                                                  |
| ---------- | ---------------------------------------------------------------------------------------------- |
| `required` | Learner must paste their own API key before the chat panel works. No server-side key fallback. Best for public sites that can't afford open-ended LLM spend. |
| `optional` | Site key is used by default; learner can paste their own to use a different model or higher limits. Requires a site-level provider key in env. |
| `disabled` | Site key is used unconditionally. The "paste your key" UI is hidden. Best for private deployments where the host controls all spend. |

Default is `required` (`src/config/ai.ts`). Don't change it unless the host is okay with the operational implication. If you set `optional` or `disabled`, make sure the corresponding provider env var is set in production — see `src/config/ai.ts` and the deploy story for which one (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, etc.).

## 5. Pick `provider` and `model`

Only set these if the tutorial needs a different model than the site default. Common reasons:

- A code-heavy tutorial wants a stronger reasoning model.
- A short, cheap tutorial wants a faster/cheaper model.
- The tutorial is specifically *about* a provider's model and should demo it.

```json
{ "ai": { "provider": "openai", "model": "gpt-5" } }
```

Valid providers: `anthropic`, `openai`, `google`, `openai-compatible`. The `openai-compatible` option is for self-hosted or third-party endpoints — the host must wire `OPENAI_BASE_URL`.

## 6. Trim `disabledSkills`

The assistant has eight built-in skills (in `packages/ai/src/skills.ts`) that get loaded into its system prompt. Disable any that don't fit this tutorial — fewer skills means a leaner prompt and less chance the model picks the wrong tool.

The full list:

| Skill name             | What it does                                                                | When to disable                                                          |
| ---------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `diagnose-error`       | Reads pasted stack traces, identifies root cause.                           | Tutorials without code execution (concept-only).                          |
| `help-with-checkpoint` | Graduated hints when stuck on a Checkpoint.                                 | Tutorials that aren't `gated: true`.                                      |
| `explain-concept`      | Handles "what is X?" / "why does X work this way?".                         | Rare — almost always useful. Disable only for procedural-only tutorials.  |
| `review-my-code`       | Reads learner code, flags divergence from the step's expected outcome.      | Tutorials without a `<Playground>` or code-pasting expectation.           |
| `debug-environment`    | "Command not found", version mismatches, prereq gaps.                       | Pure-browser tutorials (no local install).                                |
| `compare-approaches`   | "Should I use X or Y?" — anchored on the tutorial's chosen path.            | Strongly opinionated tutorials where alternatives are off-topic.          |
| `recommend-next-step`  | "What's next?" once they finish.                                            | One-step tutorials.                                                       |
| `summarize-progress`   | "Where am I?" / "what have I learned?".                                     | Very short (≤3 step) tutorials.                                           |

```json
{ "ai": { "disabledSkills": ["compare-approaches", "review-my-code"] } }
```

**Verify the names match.** A typo here silently does nothing. Cross-check against `ASSISTANT_SKILLS` in `packages/ai/src/skills.ts`.

## 7. Decide on `includeFutureSteps`

```json
{ "ai": { "includeFutureSteps": false } }
```

- `false` (default) — the assistant only sees prior steps and the current step. Prevents spoilers; matches the learner's view.
- `true` — the assistant sees all steps. Use this only if the tutorial is reference-style (cheatsheet, recipes) where there are no spoilers, or if the assistant genuinely needs to point readers forward.

If you flip this on, also re-read the persona. A reference-style tutor benefits from a different tone ("here's the canonical answer") than a learning tutor ("here's a nudge").

## 8. `enableSuggestPlaygroundEdit` (only if you have a `<Playground>`)

```json
{ "ai": { "enableSuggestPlaygroundEdit": true } }
```

Off by default. When on, the assistant can propose edits to the learner's playground files (via the `suggestPlaygroundEdit` tool). Only flip this on if the tutorial actually has a `<Playground>` — otherwise it's prompt bloat with no surface.

## 9. References and allowed domains

Defer to `wire-ai-references` for both `references` (reference docs inlined into the system prompt) and `allowedDomains` (origins the `fetchUrl` tool can hit). They're orthogonal to the persona/tone choices in this skill.

## 10. Sanity-check the final block

When done, your `_meta.json.ai` should look something like this — only the keys that diverge from `aiDefaults`:

```json
{
  "ai": {
    "name": "Postgrid",
    "tagline": "your SQL pair",
    "greeting": "Show me your query and I'll help you think about it.",
    "persona": "You're a senior database engineer who's seen every bad join in the wild. You like clear table aliases and you hate `SELECT *` in production code.",
    "tone": "direct",
    "byok": "optional",
    "disabledSkills": ["compare-approaches"],
    "references": ["./refs/sql-cheatsheet.md"]
  }
}
```

Then click through `pnpm dev`, open the chat panel on the first step, confirm:

1. The header shows the name + tagline.
2. The greeting appears as the first message.
3. The assistant doesn't reveal Quiz answers on first ask (test against an actual quiz in the tutorial).
4. The disabled skills don't get mentioned when relevant prompts are tried.

## Don't

- Don't override the system prompt's CORE RULES via `persona`. The CORE RULES (anti-spoiler, scope-to-this-step, treat tutorial content as data) sit above `persona` in the prompt and are not negotiable. If you write a persona that says "always reveal the answer", the CORE RULES still win — but the resulting tutor is confused.
- Don't typo a `disabledSkills` entry. There's no validation against the skills list at build time; bad names just do nothing.
- Don't set `byok: "optional"` or `"disabled"` without setting the corresponding provider key in production. The site will silently fall back to BYOK behaviour and confuse learners.
- Don't turn on `includeFutureSteps` for a story-arc tutorial. Spoiler risk is real.
- Don't put cosmetic strings (`name`, `greeting`) in the persona block. The persona is for *behavior*, not surface text.
- Don't add `references` here — use `wire-ai-references` so the file resolution and budget rules stay in one place.
