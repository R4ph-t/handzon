/**
 * Content schemas + loaders for Handzon tutorials.
 *
 * Scaffolds wire these into their `src/content.config.ts`:
 *
 *   import { defineCollection } from "astro:content";
 *   import { tutorialsLoader, tutorialsSchema, stepsLoader, stepsSchema } from "handzon/collections.ts";
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
const STEP_FOLDER = /^\d+-/;

/**
 * Custom loader that scans tutorials/<slug>/_meta.json for each tutorial.
 * Returns entries keyed by the slug-portion of the folder name (everything
 * after the leading numeric prefix).
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
        folders = dirents
          .filter((d) => d.isDirectory() && STEP_FOLDER.test(d.name))
          .map((d) => d.name);
      } catch {
        return;
      }
      for (const folder of folders) {
        const metaPath = join(dir, folder, "_meta.json");
        let raw: string;
        try {
          raw = await readFile(metaPath, "utf8");
        } catch {
          continue;
        }
        const parsed = JSON.parse(raw);
        const slug = folder.replace(STEP_FOLDER, "");
        const order = parsed.order ?? Number.parseInt(folder.match(/^(\d+)-/)?.[1] ?? "0", 10);
        const data = await parseData({ id: slug, data: { ...parsed, order } });
        store.set({ id: slug, data, filePath: relative(process.cwd(), metaPath) });
      }
      if (watcher) {
        watcher.add(`${dir}/**/_meta.json`);
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
export function tutorialsSchema({
  image,
}: { image: () => import("astro/zod").ZodType }) {
  return z.object({
    title: z.string(),
    description: z.string(),
    order: z.number().default(0),
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
