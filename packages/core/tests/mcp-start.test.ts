import assert from "node:assert/strict";
import test from "node:test";
import {
  buildStartTutorialPayload,
  createStartTutorialTool,
} from "../src/server/mcp/startTutorial.ts";

const steps = [
  {
    slug: "setup",
    order: 1,
    title: "Set up the project",
    summary: "Create and install the app.",
    duration: "5 min",
    verify: {
      id: "setup/dev-server",
      cwd: "$LEARNER_PROJECT",
      checks: [{ kind: "shell", run: "pnpm test", expect: { exitCode: 0 } }],
    },
  },
];

test("builds git starter commands for a blank workspace", () => {
  const payload = buildStartTutorialPayload({
    tutorial: {
      slug: "react-todo",
      title: "Build a TODO app with React",
      description: "Build a client app.",
      difficulty: "beginner",
      tags: ["react"],
      starter: {
        kind: "git",
        repo: "https://github.com/example/react-todo-starter.git",
        ref: "main",
        targetDir: "todo-app",
        setupCommands: ["pnpm install"],
        devCommand: "pnpm dev",
      },
    },
    steps,
    workspaceName: "my-todo",
  });

  assert.deepEqual(payload.workspace, { targetDir: "my-todo", openPath: "my-todo" });
  assert.deepEqual(payload.commands, [
    "git clone --branch main https://github.com/example/react-todo-starter.git my-todo",
    "cd my-todo",
    "pnpm install",
  ]);
  assert.equal(payload.firstStep.slug, "setup");
  assert.equal(payload.firstStep.verify?.id, "setup/dev-server");
  assert.match(payload.next[0], /get_step/);
  assert.match(payload.next[2], /submit_verification/);
});

test("builds command starter commands with an open subdirectory", () => {
  const payload = buildStartTutorialPayload({
    tutorial: {
      slug: "python-api",
      title: "Deploy a Python API",
      description: "Build and deploy an API.",
      difficulty: "intermediate",
      tags: ["python"],
      starter: {
        kind: "command",
        initCommand: "uv init api",
        targetDir: "api",
        openPath: "api",
        setupCommands: ["uv sync"],
      },
    },
    steps,
  });

  assert.deepEqual(payload.workspace, { targetDir: "api", openPath: "api" });
  assert.deepEqual(payload.commands, ["uv init api", "cd api", "uv sync"]);
});

test("creates start_tutorial as a catalog read MCP tool", () => {
  const tool = createStartTutorialTool(async () => {
    throw new Error("not used");
  });

  assert.equal(tool.name, "start_tutorial");
  assert.deepEqual(tool.inputSchema.required, ["slug"]);
});
