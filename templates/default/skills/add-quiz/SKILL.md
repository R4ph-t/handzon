---
name: add-quiz
description: Author a Quiz block with valid schema and good distractors.
triggers: ["add quiz", "create quiz", "write quiz"]
---

1. Identify the **one thing** the quiz should test. Quizzes that test 3 things at once are usually too hard.
2. Write the question as a complete sentence ending in a question mark.
3. Write 4 options. Rules for distractors:
   - **Plausible.** A "trick" option should be a real misconception a learner has.
   - **Mutually exclusive.** No two options can both be correct unless you set `multi`.
   - **Similar length.** A noticeably-longer option screams "correct answer".
4. `answer` is the **zero-indexed** position of the correct option (or an array for multi-select).
5. Write an `explanation` that says **why** the answer is correct — not just that it is. This is the most valuable part of the component.

```mdx
<Quiz
  question="What does `useState` return?"
  options={[
    "Just the current value",
    "A [value, setter] tuple",
    "A getter function",
    "Nothing — it's a side-effect hook"
  ]}
  answer={1}
  explanation="`useState` returns a 2-element array: the current value and a setter that triggers a re-render."
/>
```
