import assert from "node:assert/strict";
import test from "node:test";
import {
  canVisitGatedStep,
  firstIncompletePrerequisite,
  lockedStepSlugs,
} from "../src/lib/progress/gating.ts";

const stepSlugs = ["setup", "list", "add-item", "persistence"];

test("gated tutorials allow the first step and lock steps after the first incomplete step", () => {
  const steps = {
    "react-todo/setup": "complete" as const,
    "react-todo/list": "incomplete" as const,
  };

  assert.equal(
    canVisitGatedStep({ tutorialSlug: "react-todo", stepSlugs, stepSlug: "setup", steps }),
    true,
  );
  assert.equal(
    canVisitGatedStep({ tutorialSlug: "react-todo", stepSlugs, stepSlug: "list", steps }),
    true,
  );
  assert.equal(
    canVisitGatedStep({ tutorialSlug: "react-todo", stepSlugs, stepSlug: "add-item", steps }),
    false,
  );
  assert.deepEqual(lockedStepSlugs({ tutorialSlug: "react-todo", stepSlugs, steps }), [
    "add-item",
    "persistence",
  ]);
});

test("locked direct visits redirect to the earliest incomplete prerequisite", () => {
  const steps = {
    "react-todo/setup": "complete" as const,
    "react-todo/list": "incomplete" as const,
  };

  assert.equal(
    firstIncompletePrerequisite({
      tutorialSlug: "react-todo",
      stepSlugs,
      stepSlug: "persistence",
      steps,
    }),
    "list",
  );
});

test("unknown steps are not locked by gated tutorial progress rules", () => {
  assert.equal(
    canVisitGatedStep({
      tutorialSlug: "react-todo",
      stepSlugs,
      stepSlug: "not-a-step",
      steps: {},
    }),
    true,
  );
});
