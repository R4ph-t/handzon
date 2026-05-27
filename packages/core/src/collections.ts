/**
 * Content schemas + loaders for Handzon tutorials.
 *
 * Scaffolds wire these into their `src/content.config.ts`:
 *
 *   import { defineCollection } from "astro:content";
 *   import { tutorialsLoader, tutorialsSchema, stepsLoader, stepsSchema } from "handzon-core/collections.ts";
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

/**
 * Glob loader for tutorial step `.mdx`/`.md` files.
 *
 * After the inner glob populates the store we walk every entry once
 * and reject any step whose `verify.id` doesn't match a
 * `<Checkpoint id="…">` in the MDX body. Catching this at load time
 * means an author who renames a checkpoint id but forgets the
 * frontmatter sees a loud build failure instead of silently broken
 * verification at run time.
 */
export function stepsLoader(): Loader {
  const inner = glob({
    pattern: "**/[0-9]*-*.{mdx,md}",
    base: `./${TUTORIALS_REL}`,
  });
  return {
    name: "handzon-steps",
    load: async (args) => {
      await inner.load(args);
      const checkpointRe = /<Checkpoint\b[^>]*\bid\s*=\s*(?:"([^"]+)"|'([^']+)'|\{`([^`]+)`\})/g;
      for (const value of args.store.values()) {
        const verify = (value.data as { verify?: { id?: string } } | undefined)?.verify;
        if (!verify?.id) continue;
        const body = value.body ?? "";
        const ids = new Set<string>();
        checkpointRe.lastIndex = 0;
        for (;;) {
          const m = checkpointRe.exec(body);
          if (m === null) break;
          const id = m[1] ?? m[2] ?? m[3];
          if (id) ids.add(id);
        }
        if (!ids.has(verify.id)) {
          throw new Error(
            `[handzon] step ${value.id}: verify.id "${verify.id}" has no matching <Checkpoint id="…"> in the step body. Either add a <Checkpoint id="${verify.id}" …/> or remove the verify block.`,
          );
        }
      }
    },
  };
}

/**
 * Schema for machine-verifiable checkpoint specs (Family D). Authors
 * declare deterministic checks per step; the agent runs them on the
 * learner's machine and POSTs observed values back to the server,
 * which scores against the spec via the evaluator.
 *
 * `kind` is a discriminated union — only the fields valid for each
 * check kind pass validation.
 */
export const verifyCheckSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("file_exists"),
    path: z.string().min(1),
    hint: z.string().optional(),
  }),
  z.object({
    kind: z.literal("file_contains"),
    path: z.string().min(1),
    /** Regex matched against the file body. */
    pattern: z.string().min(1),
    hint: z.string().optional(),
  }),
  z.object({
    kind: z.literal("shell"),
    run: z.string().min(1),
    expect: z
      .object({
        exitCode: z.number().int().optional(),
        stdoutMatches: z.string().optional(),
      })
      .default({}),
    hint: z.string().optional(),
  }),
  z.object({
    kind: z.literal("http"),
    url: z.string().min(1),
    expect: z
      .object({
        status: z.number().int().optional(),
        bodyIncludes: z.string().optional(),
        bodyMatches: z.string().optional(),
      })
      .default({}),
    hint: z.string().optional(),
  }),
]);

export type VerifyCheck = z.infer<typeof verifyCheckSchema>;

export const verifySchema = z.object({
  /** Must match a <Checkpoint id> in the step's MDX. */
  id: z.string().min(1),
  /** Advisory cwd hint passed to the agent (e.g. "$LEARNER_PROJECT"). */
  cwd: z.string().optional(),
  checks: z.array(verifyCheckSchema).min(1),
});

export type VerifySpec = z.infer<typeof verifySchema>;

export const starterSchema = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.literal("git"),
      repo: z.string().url(),
      ref: z.string().min(1).optional(),
      subdir: z.string().min(1).optional(),
      targetDir: z.string().min(1).optional(),
      setupCommands: z.array(z.string().min(1)).default([]),
      devCommand: z.string().min(1).optional(),
      openPath: z.string().min(1).optional(),
      notes: z.array(z.string().min(1)).default([]),
    })
    .strict(),
  z
    .object({
      kind: z.literal("command"),
      initCommand: z.string().min(1),
      targetDir: z.string().min(1).optional(),
      setupCommands: z.array(z.string().min(1)).default([]),
      devCommand: z.string().min(1).optional(),
      openPath: z.string().min(1).optional(),
      notes: z.array(z.string().min(1)).default([]),
    })
    .strict(),
]);

export type StarterSpec = z.infer<typeof starterSchema>;

/** Schema for tutorial step entries. */
export const stepsSchema = z.object({
  title: z.string(),
  duration: z.string().optional(),
  summary: z.string().optional(),
  ai: z.boolean().optional(),
  verify: verifySchema.optional(),
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
    // TODO(handzon): `cover` and `icon` are accepted by the schema for
    // forward compatibility, but no page currently renders them
    // (Home cards, TutorialLanding, OG meta all ignore them). Wire them
    // up in TutorialCard and BaseLayout's OG tags before promoting
    // cover art in author-facing docs and skills.
    cover: image().optional(),
    icon: z.union([z.string(), image()]).optional(),
    steps: z.array(z.string()).optional(),
    gated: z.boolean().default(false),
    showProgress: z.boolean().default(true),
    feedbackUrl: z.string().url().optional(),
    starter: starterSchema.optional(),
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
