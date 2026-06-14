import assert from "node:assert/strict";
import test from "node:test";
import {
  collectProgressItemIds,
  validateProgressItemIds,
} from "../src/lib/progress/progressItems.ts";

test("collects explicit Quiz and Checkpoint ids from a step body", () => {
  const ids = collectProgressItemIds(`
<Quiz
  id="intro/key-concept"
  question="What matters?"
  options={["A", "B"]}
  answer={0}
/>

<Checkpoint id='intro/done' label="I did the thing." />
`);

  assert.deepEqual(ids, {
    Checkpoint: new Set(["intro/done"]),
    Quiz: new Set(["intro/key-concept"]),
  });
});

test("requires every Quiz and Checkpoint to have an explicit id", () => {
  assert.throws(
    () =>
      validateProgressItemIds({
        body: `
<Quiz question="Missing id?" options={["A", "B"]} answer={0} />
<Checkpoint label="Missing id too." />
`,
        entryId: "authoring-101/interactive-components",
      }),
    /<Quiz> must include an explicit id/,
  );
});

test("allows Quiz and Checkpoint examples inside fenced code blocks", () => {
  assert.doesNotThrow(() =>
    validateProgressItemIds({
      body: `
\`\`\`mdx
<Quiz question="Example only" options={["A", "B"]} answer={0} />
<Checkpoint label="Example only." />
\`\`\`

<Quiz id="real/quiz" question="Real?" options={["A", "B"]} answer={0} />
`,
      entryId: "authoring-101/mdx-basics",
    }),
  );
});

test("ignores component-looking text inside attribute strings", () => {
  assert.doesNotThrow(() =>
    validateProgressItemIds({
      body: `
<Quiz
  id="interactive-components/gating"
  question="What gates a step?"
  options={["A Checkpoint or Quiz component", "Nothing"]}
  answer={0}
  explanation="A <Checkpoint /> or <Quiz /> can gate a step."
/>
`,
      entryId: "authoring-101/interactive-components",
    }),
  );
});
