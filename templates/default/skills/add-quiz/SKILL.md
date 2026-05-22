---
name: add-quiz
description: Author a `<Quiz>` block — pick the one concept worth testing, write plausible distractors, decide single vs multi-answer, write the explanation, and use a stable id so progress survives content edits.
triggers: ["add quiz", "create quiz", "write quiz", "knowledge check", "comprehension check"]
---

Use this when the author wants to add a comprehension check inside a step. A `<Quiz>` is *not* a test of trivia — it's a way to make the reader stop and articulate what they just learned, with feedback if they got it wrong.

## 1. Decide if a quiz belongs here

Ask first. A quiz is the right tool when **all** of these are true:

- The reader just learned a concept they could easily skim past without internalizing.
- There's a common misconception worth surfacing (this becomes a distractor).
- A wrong answer should produce *useful* feedback — not just "no, try again".

If none of those apply, a `<Recap>` or `<Callout type="tip">` is probably the better tool. Don't quiz for the sake of quizzing.

## 2. Pick the one thing to test

A `<Quiz>` tests **one concept**. If you find yourself wanting to ask about three things, that's three quizzes (or one of them isn't important enough). Multi-concept quizzes are confusing because the reader can't tell which distractor goes with which concept.

Finish this sentence: *"The reader walks away from this quiz understanding that ___."* That sentence is your quiz's purpose. Discard any option or wording that doesn't serve it.

## 3. Write the question

- Complete sentence ending in `?`.
- Use vocabulary the reader has already met in this tutorial. No surprise jargon.
- Avoid negatives unless the negative *is* the point — "Which of these is **not** valid?" is fine when "spot the invalid one" is the skill being taught, otherwise it doubles the cognitive load.
- Don't telegraph the answer: avoid phrasing that only makes grammatical sense with one option.

## 4. Write the options

Always **4 options.** Three or fewer makes guessing too easy; five or more is hard to scan.

- **Plausible.** Each wrong option should be a real misconception or near-miss a learner has actually made. "The moon is made of cheese" is not a distractor — it's a joke. Source distractors from real questions you've seen.
- **Mutually exclusive.** No two options can both be correct unless you're doing multi-select (see section 5). "Returns an object" and "Returns `{x, y}`" overlap and confuse the reader.
- **Length parity.** A noticeably longer option screams "correct answer". Trim the answer or pad the distractors until they look the same.
- **No "all of the above" / "none of the above".** These are quiz anti-patterns. They reward elimination over understanding and the correct option is almost always "all of the above".
- **Distribute the correct answer position.** When the author has multiple quizzes in a tutorial, vary which slot is correct — readers pattern-match.

## 5. Single vs multi-answer

The component supports both:

- **Single answer (default)** — `answer={2}`. Renders as radio buttons. Use this 90% of the time.
- **Multi answer** — `answer={[0, 2]}`. Renders as checkboxes. Use only when "spot all the X" is genuinely the skill being taught, e.g. "Which of these are valid React hooks?"

The `multi` prop is auto-derived from whether `answer` is an array — you only need to set `multi` explicitly when you want checkboxes with a single correct answer (rare). The component requires *all* correct options selected and *no* incorrect ones; there's no partial credit.

## 6. Write the explanation

The `explanation` only renders after submit, but it is the **single most valuable part of the quiz**. The skill says "write distractors" but the *learning* happens in the explanation. Treat it as required even though the prop is optional.

Rules:

- **Explain why the answer is correct**, not just *that* it is.
- **Address the most plausible distractor.** If the reader picked B, the explanation should help them see why A was right *and* what made B tempting.
- **Keep it to 1–2 sentences.** Long explanations get skipped.
- Link to deeper reading if the concept warrants it, but don't make the explanation a redirect.

## 7. Use a stable `id` for important quizzes

Progress is keyed by `id ?? "quiz:<react-id>:<question-prefix>"`. The default `react-id` is positional — if the author later inserts a new quiz or `<Checkpoint>` *above* this one, the positional id shifts and the reader's previous answer is lost.

For quizzes the author cares about persisting (graded series, anything in a gated tutorial), pass an explicit `id`:

```mdx
<Quiz
  id="hooks/use-state-returns"
  question="What does `useState` return?"
  ...
/>
```

Use a `<tutorial-area>/<concept>` slug. Stable, human-readable, won't collide.

## 8. Placement

- **Not at the top of a step.** The reader hasn't learned anything yet.
- **Mid-step**, right after the concept it tests has been explained — close enough that the answer is fresh, far enough that the reader had to do the thinking.
- **Not adjacent to the `<Recap>`.** The quiz IS a recap; back-to-back feels redundant.
- One per step is the comfortable maximum; two is fine if they test different concepts; three+ feels like an exam.

## 9. Example

```mdx
<Quiz
  id="hooks/use-state-returns"
  question="What does `useState` return?"
  options={[
    "Just the current value",
    "A [value, setter] tuple",
    "A getter function the caller invokes to read the value",
    "Nothing — it's a side-effect hook"
  ]}
  answer={1}
  explanation="`useState` returns a 2-element array: the current value and a setter that triggers a re-render when called. Option 3 is tempting if you've used Vue's `ref()`, which does return a getter — React's mental model is different."
/>
```

Note: the distractors aren't filler — option 3 is the Vue-developer misconception, option 4 is the `useEffect`-confusion misconception, option 1 is the most common naive guess. The explanation names the misconception in option 3 by name.

## Don't

- Don't add a quiz where a `<Recap>` would do. A quiz interrupts; use it only when interruption is warranted.
- Don't quiz on text the reader hasn't seen yet. The quiz tests learning, not guessing.
- Don't use "all of the above" or "none of the above" options. They're anti-patterns.
- Don't write distractors that are jokes or obviously wrong. Wrong options must be plausible misconceptions or the quiz teaches nothing.
- Don't leave `explanation` empty. It's the most valuable part of the component.
- Don't omit `id` for quizzes whose progress matters. Default ids drift when content is reordered.
- Don't reach for `multi` unless "spot all of them" is genuinely the skill. Multi-select with one correct answer is almost always wrong.
- Don't `import` Quiz — it's globally registered like every other MDX component.
