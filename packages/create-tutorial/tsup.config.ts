import { defineConfig } from "tsup";
import { cp } from "node:fs/promises";
import { resolve } from "node:path";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "node20",
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
    await cp(src, dst, {
      recursive: true,
      filter: (path) =>
        !path.includes("node_modules") &&
        !path.includes("/.astro") &&
        !path.endsWith("/dist") &&
        !path.includes("/dist/"),
    });
  },
});
