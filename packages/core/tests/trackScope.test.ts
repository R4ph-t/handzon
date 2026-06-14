import assert from "node:assert/strict";
import test from "node:test";
import { isItemInActiveTrack } from "../src/lib/progress/trackScope.ts";

test("shared items (outside any track panel) always count", () => {
  assert.equal(isItemInActiveTrack(undefined, "py"), true);
  assert.equal(isItemInActiveTrack(null, "ts"), true);
  assert.equal(isItemInActiveTrack(undefined, undefined), true);
});

test("track-scoped items only count for the active track", () => {
  assert.equal(isItemInActiveTrack("py", "py"), true);
  assert.equal(isItemInActiveTrack("ts", "py"), false);
});

test("track-scoped items count when no track is active", () => {
  assert.equal(isItemInActiveTrack("py", undefined), true);
  assert.equal(isItemInActiveTrack("py", null), true);
});
