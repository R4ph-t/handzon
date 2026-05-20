import assert from "node:assert/strict";
import { test } from "node:test";
import { isValidSlug, slugify } from "../src/shared/slugify";

test("slugify basic", () => {
  assert.equal(slugify("Hello World"), "hello-world");
  assert.equal(slugify("  Foo   Bar  "), "foo-bar");
  assert.equal(slugify("Build a TODO app!"), "build-a-todo-app");
  assert.equal(slugify("Café & Croissant"), "cafe-croissant");
});

test("isValidSlug", () => {
  assert.equal(isValidSlug("hello"), true);
  assert.equal(isValidSlug("hello-world"), true);
  assert.equal(isValidSlug("Hello"), false);
  assert.equal(isValidSlug("-leading"), false);
  assert.equal(isValidSlug("trailing-"), false);
  assert.equal(isValidSlug(""), false);
});
