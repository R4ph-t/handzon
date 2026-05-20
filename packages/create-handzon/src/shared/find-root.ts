import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

/**
 * Walk up from cwd looking for a directory that contains
 * `astro.config.mjs` AND `src/content/tutorials/`. Returns the absolute
 * path or null.
 */
export function findProjectRoot(start = process.cwd()): string | null {
  let dir = resolve(start);
  while (true) {
    const astroCfg = join(dir, "astro.config.mjs");
    const contentDir = join(dir, "src/content/tutorials");
    if (existsSync(astroCfg) && existsSync(contentDir)) {
      // Sanity-check: astro.config references @astrojs/mdx
      try {
        const body = readFileSync(astroCfg, "utf8");
        if (body.includes("@astrojs/mdx")) return dir;
      } catch {
        // ignore
      }
    }
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}
