import assert from "node:assert/strict";
import test from "node:test";
import { getDefaultCoverMeta } from "../src/lib/defaultCover.ts";

test("default cover metadata is deterministic for the same tutorial", () => {
  const input = {
    slug: "deploy-python-api",
    title: "Deploy a Python API",
    difficulty: "intermediate",
    tags: ["python", "api"],
    icon: undefined,
  };

  assert.deepEqual(getDefaultCoverMeta(input), getDefaultCoverMeta(input));
});

test("default cover uses known tag icons", () => {
  const meta = getDefaultCoverMeta({
    slug: "deploy-python-api",
    title: "Deploy a Python API",
    difficulty: "intermediate",
    tags: ["python", "api"],
    icon: "PY",
  });

  assert.equal(meta.icon?.title, "Python");
  assert.equal(meta.label, "python");
});

test("default cover scans tags for known icons", () => {
  const meta = getDefaultCoverMeta({
    slug: "intro-to-sql",
    title: "Intro to SQL",
    difficulty: "beginner",
    tags: ["sql", "databases", "postgres"],
    icon: undefined,
  });

  assert.equal(meta.icon?.title, "PostgreSQL");
  assert.equal(meta.label, "sql");
});

test("default cover derives short ghost keywords from tags and title", () => {
  const meta = getDefaultCoverMeta({
    slug: "react-todo",
    title: "Build a TODO app with React",
    difficulty: "beginner",
    tags: ["react", "vite", "frontend", "javascript"],
    icon: undefined,
  });

  assert.deepEqual(meta.keywords, ["REACT", "VITE", "FRONTEND"]);
});

test("default cover uses only grid or dots patterns", () => {
  const examples = [
    getDefaultCoverMeta({
      slug: "react-todo",
      title: "Build a TODO app with React",
      difficulty: "beginner",
      tags: ["react", "vite"],
      icon: undefined,
    }),
    getDefaultCoverMeta({
      slug: "intro-to-sql",
      title: "Intro to SQL",
      difficulty: "beginner",
      tags: ["sql", "databases", "postgres"],
      icon: undefined,
    }),
    getDefaultCoverMeta({
      slug: "authoring-101",
      title: "Authoring 101",
      difficulty: "beginner",
      tags: ["meta", "authoring"],
      icon: undefined,
    }),
  ];

  assert.deepEqual(
    examples.map((meta) => meta.pattern),
    ["grid", "dots", "grid"],
  );
  assert.ok(examples.every((meta) => meta.pattern === "grid" || meta.pattern === "dots"));
});

test("default cover varies pattern scale and glow independently", () => {
  const examples = [
    getDefaultCoverMeta({
      slug: "authoring-101",
      title: "Authoring 101",
      difficulty: "beginner",
      tags: ["meta", "authoring"],
      icon: undefined,
    }),
    getDefaultCoverMeta({
      slug: "react-todo",
      title: "Build a TODO app with React",
      difficulty: "beginner",
      tags: ["react", "vite"],
      icon: undefined,
    }),
    getDefaultCoverMeta({
      slug: "intro-to-sql",
      title: "Intro to SQL",
      difficulty: "beginner",
      tags: ["sql", "databases", "postgres"],
      icon: undefined,
    }),
    getDefaultCoverMeta({
      slug: "multi-track-hello",
      title: "Multi-track Hello API",
      difficulty: "intermediate",
      tags: ["tracks", "python", "typescript", "api"],
      icon: undefined,
    }),
  ];

  assert.ok(new Set(examples.map((meta) => meta.scale)).size > 1);
  assert.ok(new Set(examples.map((meta) => meta.glow)).size > 1);
});

test("default cover does not invent center text when no meaningful icon exists", () => {
  const meta = getDefaultCoverMeta({
    slug: "getting-started",
    title: "Getting Started",
    difficulty: "beginner",
    tags: [],
    icon: undefined,
  });

  assert.equal(meta.icon, undefined);
  assert.equal(meta.label, "beginner");
  assert.deepEqual(meta.keywords, ["GETTING", "STARTED"]);
});
