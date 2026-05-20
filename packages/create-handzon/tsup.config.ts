import { cp, readFile, rm, writeFile } from "node:fs/promises";
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

// Workspace deps that need to point at published versions in the
// bundled template — see `rewriteWorkspaceDeps()` below.
const WORKSPACE_DEPS_TO_VERSIONS: Record<string, string> = {
  "@handzon/ui": "^0.2.0",
  "@handzon/ai": "^0.2.0",
};

async function rewriteWorkspaceDeps(pkgJsonPath: string) {
  const raw = await readFile(pkgJsonPath, "utf8");
  const pkg = JSON.parse(raw);
  let changed = false;
  for (const block of ["dependencies", "devDependencies"] as const) {
    const deps = pkg[block];
    if (!deps) continue;
    for (const [name, version] of Object.entries(WORKSPACE_DEPS_TO_VERSIONS)) {
      if (deps[name] === "workspace:*" || deps[name]?.startsWith?.("workspace:")) {
        deps[name] = version;
        changed = true;
      }
    }
  }
  if (changed) await writeFile(pkgJsonPath, `${JSON.stringify(pkg, null, 2)}\n`, "utf8");
}

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

    // The template inside the monorepo uses `workspace:*` for handzon
    // and @handzon/ai so dev links the local sources. In the
    // bundled tarball that's not resolvable, so replace those with the
    // published version ranges users actually need.
    await rewriteWorkspaceDeps(resolve(dst, "package.json"));
  },
});
