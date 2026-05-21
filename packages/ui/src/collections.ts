/**
 * Content schemas + loaders for Handzon tutorials.
 *
 * Scaffolds wire these into their `src/content.config.ts`:
 *
 *   import { defineCollection } from "astro:content";
 *   import { tutorialsLoader, tutorialsSchema, stepsLoader, stepsSchema } from "handzon-ui/collections.ts";
 *
 *   export const collections = {
 *     tutorials: defineCollection({ loader: tutorialsLoader(), schema: tutorialsSchema }),
 *     steps: defineCollection({ loader: stepsLoader(), schema: stepsSchema }),
 *   };
 *
 * The loader path is resolved against cwd, which is the scaffold root at
 * Astro build/dev time — no need to thread the path through.
 */
import { z } from "astro:content";
import { readdir, readFile } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import type { Loader } from "astro/loaders";
import { glob } from "astro/loaders";

const TUTORIALS_REL = "src/content/tutorials";
const INDEX_FILE = "_index.json";

async function readIndexOrder(dir: string): Promise<string[]> {
  try {
    const raw = await readFile(join(dir, INDEX_FILE), "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed?.order)
      ? parsed.order.filter((s: unknown) => typeof s === "string")
      : [];
  } catch {
    return [];
  }
}

/**
 * Custom loader that scans tutorials/<slug>/_meta.json for each tutorial.
 * Tutorial order is driven by `_index.json` at the tutorials root; folder
 * names are used verbatim as slugs (no numeric prefix expected).
 */
export function tutorialsLoader(): Loader {
  return {
    name: "tutorials-meta",
    load: async ({ store, parseData, watcher }) => {
      const dir = resolve(TUTORIALS_REL);
      store.clear();
      let folders: string[] = [];
      try {
        const dirents = await readdir(dir, { withFileTypes: true });
        folders = dirents.filter((d) => d.isDirectory()).map((d) => d.name);
      } catch {
        return;
      }
      const indexOrder = await readIndexOrder(dir);
      const listed = new Set(indexOrder);
      const unlisted = folders.filter((f) => !listed.has(f)).sort();
      const orderOf = (slug: string): number => {
        const i = indexOrder.indexOf(slug);
        if (i >= 0) return i;
        const u = unlisted.indexOf(slug);
        return u >= 0 ? indexOrder.length + u : indexOrder.length + unlisted.length;
      };
      for (const folder of folders) {
        const metaPath = join(dir, folder, "_meta.json");
        let raw: string;
        try {
          raw = await readFile(metaPath, "utf8");
        } catch {
          continue;
        }
        const parsed = JSON.parse(raw);
        const validated = await parseData({ id: folder, data: parsed });
        store.set({
          id: folder,
          data: { ...validated, order: orderOf(folder) },
          filePath: relative(process.cwd(), metaPath),
        });
      }
      if (watcher) {
        watcher.add(`${dir}/**/_meta.json`);
        watcher.add(join(dir, INDEX_FILE));
      }
    },
  };
}

/** Glob loader for tutorial step `.mdx`/`.md` files. */
export function stepsLoader() {
  return glob({
    pattern: "**/[0-9]*-*.{mdx,md}",
    base: `./${TUTORIALS_REL}`,
  });
}

/** Schema for tutorial step entries. */
export const stepsSchema = z.object({
  title: z.string(),
  duration: z.string().optional(),
  summary: z.string().optional(),
  ai: z.boolean().optional(),
});

/** Schema for tutorial entries. Pass through Astro's image() helper. */
export function tutorialsSchema({ image }: { image: () => import("astro/zod").ZodType }) {
  return z.object({
    title: z.string(),
    description: z.string(),
    author: z
      .object({
        name: z.string(),
        url: z.string().url().optional(),
        avatar: image().optional(),
      })
      .optional(),
    publishedAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    difficulty: z.enum(["beginner", "intermediate", "advanced"]).default("beginner"),
    estimatedDuration: z.string().optional(),
    prerequisites: z.array(z.string()).default([]),
    nextTutorial: z.string().optional(),
    cover: image().optional(),
    icon: z.union([z.string(), image()]).optional(),
    steps: z.array(z.string()).optional(),
    gated: z.boolean().default(false),
    showProgress: z.boolean().default(true),
    feedbackUrl: z.string().url().optional(),
    ai: z
      .object({
        enabled: z.boolean().optional(),
        name: z.string().optional(),
        tagline: z.string().optional(),
        greeting: z.string().optional(),
        avatar: image().optional(),
        persona: z.string().optional(),
        tone: z.enum(["socratic", "direct", "encouraging"]).optional(),
        provider: z.string().optional(),
        model: z.string().optional(),
        byok: z.enum(["required", "optional", "disabled"]).optional(),
        references: z.array(z.string()).default([]),
        allowedDomains: z.array(z.string()).default([]),
        disabledSkills: z.array(z.string()).default([]),
        enableSuggestPlaygroundEdit: z.boolean().default(false),
        includeFutureSteps: z.boolean().optional(),
      })
      .optional(),
  });
}
