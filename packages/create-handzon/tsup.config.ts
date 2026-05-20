import { cp, rm } from "node:fs/promises";
import { relative, resolve, sep } from "node:path";
import { defineConfig } from "tsup";

// Skills and the .cursor/.claude symlinks that point at them are
// installed on-demand via `npx skills add <github-url>` (see
// commands/skills.ts), so the bundled template doesn't need to ship
// them. Keeps the published tarball lean and avoids leaking dead
// symlinks into scaffolded projects.
const EXCLUDED_SEGMENTS = new Set([
  "node_modules",
  ".astro",
  "dist",
  "skills",
  ".cursor",
  ".claude",
]);

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "node22",
  clean: true,
  shims: true,
  bundle: true,
  splitting: false,
  sourcemap: false,
  banner: { js: "#!/usr/bin/env node" },
  external: [],
  async onSuccess() {
    // Copy the template directory into dist/template so the published
    // package is self-contained.
    const src = resolve(__dirname, "../../templates/default");
    const dst = resolve(__dirname, "dist/template");
    // tsup's `clean: true` only wipes the bundler output, not anything
    // produced in onSuccess. Wipe dist/template ourselves so newly-
    // excluded subtrees (e.g. skills/) don't survive across rebuilds.
    await rm(dst, { recursive: true, force: true });
    await cp(src, dst, {
      recursive: true,
      // Preserve the .cursor/skills + .claude/skills symlinks instead of
      // dereferencing them (which would try to copy templates/default/skills
      // into a subpath of itself and fail with ERR_FS_CP_EINVAL).
      verbatimSymlinks: true,
      // Filter on path SEGMENTS relative to src — substring matches on
      // the absolute path break when the parent tree happens to contain
      // a "node_modules" or "dist" directory (e.g. an npx install).
      filter: (path) => {
        const rel = relative(src, path);
        if (!rel || rel.startsWith("..")) return true;
        return !rel.split(sep).some((seg) => EXCLUDED_SEGMENTS.has(seg));
      },
    });
  },
});
