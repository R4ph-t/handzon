/**
 * Assistant skills (learner-facing). Each describes how the agent should
 * approach a specific intent. Loaded at startup; descriptions go into the
 * system prompt, full bodies are returned by the useSkill() tool on demand.
 */
export const ASSISTANT_SKILLS = [
  {
    name: "diagnose-error",
    description: "Use when the learner pastes an error message or stack trace.",
    triggers: ["error", "exception", "stack trace", "traceback", "ENOENT", "TypeError"],
    body: `1. Identify the error type from the first few lines.
2. Use searchCodeBlocks() with key tokens to find where it likely originated.
3. Use getStep() on that step to confirm context.
4. If the cause is ambiguous, ask exactly ONE clarifying question. Don't ask two.
5. Explain the root cause in 1-2 sentences before showing a fix.
6. Offer the fix as a minimal diff against what was shown in the relevant step.`,
  },
  {
    name: "help-with-checkpoint",
    description: "Use when the learner is stuck on a Checkpoint they can't pass.",
    triggers: ["stuck", "checkpoint", "doesn't work", "not working"],
    body: `1. Ask what they've tried first.
2. Give a graduated hint — name the area, not the answer.
3. Only reveal the full answer after an explicit second ask.
4. End with a concrete verification step ("now run X and you should see Y").`,
  },
  {
    name: "explain-concept",
    description: "Use for 'what is X?' / 'why does X work this way?' questions.",
    triggers: ["what is", "why does", "explain", "how does"],
    body: `1. Scope the explanation to what the learner has already seen in prior steps.
2. Provide one concrete example tied to the current tutorial.
3. If the concept is large, link to a reference doc rather than dumping a wall of text.
4. Cap explanations at 3 short paragraphs.`,
  },
  {
    name: "review-my-code",
    description: "Use when the learner pastes their own implementation for review.",
    triggers: ["review", "what do you think", "my code"],
    body: `1. Compare structurally to the step's expected outcome — call out where it diverges.
2. Flag correctness issues first, style second.
3. Never rewrite without permission. Suggest changes, don't dictate.
4. End with one positive observation about what they did well.`,
  },
  {
    name: "debug-environment",
    description: "Use for 'command not found', version-mismatch language.",
    triggers: ["command not found", "version", "not installed", "ENOENT"],
    body: `1. Check the tutorial's prerequisites — call out any unmet ones.
2. Suggest one-line verification commands (node --version, etc.).
3. Cross-reference the learner's reported OS via getProgress() prefs.os.
4. Don't suggest 'sudo' — most issues are pathing, not permissions.`,
  },
  {
    name: "compare-approaches",
    description: "Use for 'should I use X or Y?' questions.",
    triggers: ["should I use", "X or Y", "alternative", "better way"],
    body: `1. Anchor on the tutorial's chosen approach — that's the canonical answer in this context.
2. Articulate the tradeoffs in terms of THIS stack, not in general.
3. Offer a single reference link rather than a long comparative aside.`,
  },
  {
    name: "recommend-next-step",
    description: "Use when the learner says 'what's next?' / 'I'm done with this'.",
    triggers: ["what's next", "I'm done", "finished"],
    body: `1. Confirm completion via getProgress().
2. Suggest the next step in this tutorial via getNextStep().
3. If the tutorial is complete, surface tutorial.nextTutorial from _meta.json.
4. If neither, offer to recap what they learned.`,
  },
  {
    name: "summarize-progress",
    description: "Use for 'where am I?' / 'what have I learned so far?'.",
    triggers: ["where am I", "summary", "progress", "what have I"],
    body: `1. Use getProgress() and getOutline() to build a concise recap.
2. List completed steps with one-line summaries.
3. List remaining steps without spoilers.
4. Offer to jump anywhere.`,
  },
];
