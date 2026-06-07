import assert from "node:assert/strict";
import test from "node:test";
import { z } from "zod";
import { heroMediaSchema } from "../src/lib/heroMedia.ts";
import { createTutorialIconSchema } from "../src/lib/tutorialIcon.ts";

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
