import assert from "node:assert/strict";
import test from "node:test";
import { z } from "zod";
import { heroMediaSchema } from "../src/lib/heroMedia.ts";
import { isTutorialListed, isTutorialPublished } from "../src/lib/publication.ts";
import { createTutorialIconSchema } from "../src/lib/tutorialIcon.ts";
import { createTutorialSummary } from "../src/lib/tutorialSummary.ts";

const imageSchema = () =>
  z
    .string()
    .regex(/^\.\/.+\.(png|jpe?g|webp|gif)$/)
    .transform((src) => ({ src, width: 512, height: 512, format: "png" }));

test("tutorial icon parses relative image paths as images before text", () => {
  const parsed = createTutorialIconSchema(z, imageSchema).parse("./assets/icon.png");

  assert.deepEqual(parsed, {
    src: "./assets/icon.png",
    width: 512,
    height: 512,
    format: "png",
  });
});

test("tutorial icon still accepts short text labels", () => {
  const parsed = createTutorialIconSchema(z, imageSchema).parse("AI");

  assert.equal(parsed, "AI");
});

test("steps schema accepts image hero media with required alt text", () => {
  const parsed = heroMediaSchema.parse({
    kind: "image",
    src: "./assets/deploy-dashboard.png",
    alt: "Render deploy settings for the Python API",
  });

  assert.deepEqual(parsed, {
    kind: "image",
    src: "./assets/deploy-dashboard.png",
    alt: "Render deploy settings for the Python API",
  });
});

test("steps schema accepts video hero media with iframe defaults", () => {
  const parsed = heroMediaSchema.parse({
    kind: "video",
    src: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    title: "Walkthrough video",
  });

  assert.deepEqual(parsed, {
    kind: "video",
    src: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    title: "Walkthrough video",
    aspect: "16/9",
    type: "iframe",
  });
});

test("steps schema requires accessible text for hero media", () => {
  assert.throws(
    () =>
      heroMediaSchema.parse({
        kind: "image",
        src: "./assets/deploy-dashboard.png",
      }),
    /alt/,
  );

  assert.throws(
    () =>
      heroMediaSchema.parse({
        kind: "video",
        src: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      }),
    /title/,
  );
});

test("tutorial publication helpers distinguish hidden from unpublished tutorials", () => {
  assert.equal(isTutorialPublished({}), true);
  assert.equal(isTutorialListed({}), true);

  assert.equal(isTutorialPublished({ published: true, hidden: false }), true);
  assert.equal(isTutorialListed({ published: true, hidden: false }), true);

  assert.equal(isTutorialPublished({ published: true, hidden: true }), true);
  assert.equal(isTutorialListed({ published: true, hidden: true }), false);

  assert.equal(isTutorialPublished({ published: false, hidden: false }), false);
  assert.equal(isTutorialListed({ published: false, hidden: false }), false);
});

test("tutorial summaries expose the fields needed for follow-up cards", () => {
  const summary = createTutorialSummary(
    {
      id: "deploy-python-api",
      data: {
        title: "Deploy a Python API",
        description: "Ship a Flask API to Render.",
        difficulty: "intermediate",
        estimatedDuration: undefined,
      },
    },
    "40 min",
  );

  assert.deepEqual(summary, {
    slug: "deploy-python-api",
    title: "Deploy a Python API",
    description: "Ship a Flask API to Render.",
    difficulty: "intermediate",
    duration: "40 min",
  });
});

test("tutorial summaries prefer explicit estimated duration", () => {
  const summary = createTutorialSummary(
    {
      id: "intro-to-sql",
      data: {
        title: "Intro to SQL",
        description: "Learn joins and aggregations.",
        difficulty: "beginner",
        estimatedDuration: "25 min",
      },
    },
    "30 min",
  );

  assert.equal(summary.duration, "25 min");
});
