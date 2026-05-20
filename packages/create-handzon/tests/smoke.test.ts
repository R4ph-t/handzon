import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { findProjectRoot } from "../src/shared/find-root";
import { listTutorials, nextStepPrefix, pad2 } from "../src/shared/scan-tutorials";

test("findProjectRoot detects an Astro + tutorials repo", async () => {
  const dir = await mkdtemp(join(tmpdir(), "tt-"));
  try {
    await mkdir(join(dir, "src/content/tutorials"), { recursive: true });
    await writeFile(join(dir, "astro.config.mjs"), "import x from '@astrojs/mdx'", "utf8");

    const found = findProjectRoot(dir);
    assert.equal(found, dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("listTutorials + nextStepPrefix work on a fake repo", async () => {
  const dir = await mkdtemp(join(tmpdir(), "tt-"));
  try {
    const tutsDir = join(dir, "src/content/tutorials");
    await mkdir(join(tutsDir, "01-first"), { recursive: true });
    await mkdir(join(tutsDir, "02-second"), { recursive: true });
    await writeFile(
      join(tutsDir, "01-first/_meta.json"),
      JSON.stringify({ title: "First", description: "Desc" }),
    );
    await writeFile(join(tutsDir, "01-first/01-intro.mdx"), "---\ntitle: Intro\n---\n");
    await writeFile(join(tutsDir, "01-first/02-second-step.mdx"), "---\ntitle: Step\n---\n");

    const tuts = await listTutorials(dir);
    assert.equal(tuts.length, 2);
    assert.equal(tuts[0]!.slug, "first");
    assert.equal(tuts[1]!.slug, "second");

    const nextPrefix = await nextStepPrefix(join(tutsDir, "01-first"));
    assert.equal(nextPrefix, 3);
    assert.equal(pad2(3), "03");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
