import assert from "node:assert/strict";
import test from "node:test";
import { deriveStepCompletion } from "../src/lib/progress/stepCompletion.ts";
import { emptyState } from "../src/lib/progress/types.ts";

test("step completion requires every quiz to be correct and every checkpoint to be done", () => {
  const state = emptyState();
  state.quizzes["quiz-one"] = { chosen: [0], correct: true, ts: 1 };
  state.quizzes["quiz-two"] = { chosen: [1], correct: false, ts: 2 };
  state.checkpoints["checkpoint-one"] = { ts: 3 };

  assert.equal(
    deriveStepCompletion(state, {
      quizIds: ["quiz-one", "quiz-two"],
      checkpointIds: ["checkpoint-one"],
    }),
    "incomplete",
  );

  state.quizzes["quiz-two"] = { chosen: [2], correct: true, ts: 4 };

  assert.equal(
    deriveStepCompletion(state, {
      quizIds: ["quiz-one", "quiz-two"],
      checkpointIds: ["checkpoint-one"],
    }),
    "complete",
  );
});

test("step completion ignores steps with no completion items", () => {
  assert.equal(
    deriveStepCompletion(emptyState(), {
      quizIds: [],
      checkpointIds: [],
    }),
    null,
  );
});
