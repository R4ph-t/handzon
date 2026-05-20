import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";
import { readdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import type { Loader } from "astro/loaders";

const TUTORIALS_DIR = resolve("./src/content/tutorials");
const STEP_FOLDER = /^\d+-/;

/**
 * Custom loader that scans tutorials/<slug>/_meta.json for each tutorial.
 * Returns entries keyed by the slug-portion of the folder name (everything
 * after the leading numeric prefix).
 */
function tutorialsLoader(): Loader {
  return {
    name: "tutorials-meta",
    load: async ({ store, parseData, watcher }) => {
      store.clear();
      let folders: string[] = [];
      try {
        const dirents = await readdir(TUTORIALS_DIR, { withFileTypes: true });
        folders = dirents.filter((d) => d.isDirectory() && STEP_FOLDER.test(d.name)).map((d) => d.name);
      } catch {
        return;
      }
      for (const folder of folders) {
        const metaPath = join(TUTORIALS_DIR, folder, "_meta.json");
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
        store.set({ id: slug, data, filePath: metaPath });
      }
      if (watcher) {
        watcher.add(`${TUTORIALS_DIR}/**/_meta.json`);
      }
    },
  };
}

const steps = defineCollection({
  loader: glob({
    pattern: "**/[0-9]*-*.{mdx,md}",
    base: "./src/content/tutorials",
  }),
  schema: z.object({
    title: z.string(),
    duration: z.string().optional(),
    summary: z.string().optional(),
    ai: z.boolean().optional(),
  }),
});

const tutorials = defineCollection({
  loader: tutorialsLoader(),
  schema: ({ image }) =>
    z.object({
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
          systemPrompt: z.string().optional(),
          references: z.array(z.string()).default([]),
          allowedDomains: z.array(z.string()).default([]),
          disabledSkills: z.array(z.string()).default([]),
          enableSuggestPlaygroundEdit: z.boolean().default(false),
          includeFutureSteps: z.boolean().optional(),
        })
        .optional(),
    }),
});

export const collections = { steps, tutorials };
