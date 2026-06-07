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
import { createHeroMediaSchema } from "./lib/heroMedia";
import { createTutorialIconSchema } from "./lib/tutorialIcon";

const TUTORIALS_REL = "src/content/tutorials";
const INDEX_FILE = "_index.json";

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

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

async function readTutorialTrackIds(tutorialSlug: string): Promise<string[]> {
  try {
    const raw = await readFile(join(resolve(TUTORIALS_REL), tutorialSlug, "_meta.json"), "utf8");
    const parsed = JSON.parse(raw) as { tracks?: unknown };
    return Array.isArray(parsed.tracks)
      ? parsed.tracks
          .map((track) => (isRecord(track) && typeof track.id === "string" ? track.id : null))
          .filter((id): id is string => !!id)
      : [];
  } catch {
    return [];
  }
}

function isStarterSpec(value: unknown): value is StarterSpec {
  return isRecord(value) && typeof value.kind === "string";
}

function isVerifySpec(value: unknown): value is VerifySpec {
  return isRecord(value) && typeof value.id === "string" && Array.isArray(value.checks);
}

function isTrackMap<T>(
  value: TrackScoped<T> | undefined,
  isShared: (v: unknown) => v is T,
): value is TrackMap<T> {
  return isRecord(value) && !isShared(value);
}

function validateTrackMapCoverage<T>({
  entryId,
  label,
  map,
  trackIds,
}: {
  entryId: string;
  label: string;
  map: TrackMap<T>;
  trackIds: string[];
}) {
  if (trackIds.length === 0) {
    throw new Error(
      `[handzon] ${entryId}: ${label} is keyed by track, but the tutorial declares no tracks.`,
    );
  }
  const declared = new Set(trackIds);
  const actual = Object.keys(map);
  const unknown = actual.filter((id) => !declared.has(id));
  const missing = trackIds.filter((id) => !(id in map));
  if (unknown.length > 0 || missing.length > 0) {
    const details = [
      unknown.length > 0 ? `unknown: ${unknown.join(", ")}` : null,
      missing.length > 0 ? `missing: ${missing.join(", ")}` : null,
    ]
      .filter(Boolean)
      .join("; ");
    throw new Error(`[handzon] ${entryId}: ${label} track coverage mismatch (${details}).`);
  }
}

function validateTrackIdsInBody({
  body,
  entryId,
  trackIds,
}: {
  body: string;
  entryId: string;
  trackIds: string[];
}) {
  const trackRe = /<Track\b[^>]*\bid\s*=\s*(?:"([^"]+)"|'([^']+)'|\{`([^`]+)`\})/g;
  const declared = new Set(trackIds);
  for (;;) {
    const m = trackRe.exec(body);
    if (m === null) break;
    const id = m[1] ?? m[2] ?? m[3];
    if (!id) continue;
    if (trackIds.length === 0) {
      throw new Error(
        `[handzon] step ${entryId}: <Track id="${id}"> is used, but the tutorial declares no tracks.`,
      );
    }
    if (!declared.has(id)) {
      throw new Error(
        `[handzon] step ${entryId}: <Track id="${id}"> is not declared in the tutorial's tracks.`,
      );
    }
  }
}

function validateVerifySpecCheckpoint({
  entryId,
  ids,
  trackId,
  verify,
}: {
  entryId: string;
  ids: Set<string>;
  trackId?: string;
  verify: VerifySpec;
}) {
  if (!ids.has(verify.id)) {
    const prefix = trackId ? `verify.${trackId}.id` : "verify.id";
    throw new Error(
      `[handzon] step ${entryId}: ${prefix} "${verify.id}" has no matching <Checkpoint id="…"> in the step body. Either add a <Checkpoint id="${verify.id}" …/> or remove the verify block.`,
    );
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
      const trackIdCache = new Map<string, Promise<string[]>>();
      for (const value of args.store.values()) {
        const { tutorialSlug } = parseStepCollectionId(value.id);
        const trackIdsPromise =
          trackIdCache.get(tutorialSlug) ?? readTutorialTrackIds(tutorialSlug);
        trackIdCache.set(tutorialSlug, trackIdsPromise);
        const trackIds = await trackIdsPromise;
        const body = value.body ?? "";
        validateTrackIdsInBody({ body, entryId: value.id, trackIds });

        const verify = (value.data as { verify?: TrackScoped<VerifySpec> } | undefined)?.verify;
        if (!verify) continue;
        const ids = new Set<string>();
        checkpointRe.lastIndex = 0;
        for (;;) {
          const m = checkpointRe.exec(body);
          if (m === null) break;
          const id = m[1] ?? m[2] ?? m[3];
          if (id) ids.add(id);
        }

        if (isTrackMap(verify, isVerifySpec)) {
          validateTrackMapCoverage({
            entryId: `step ${value.id}`,
            label: "verify",
            map: verify,
            trackIds,
          });
          for (const [trackId, spec] of Object.entries(verify)) {
            validateVerifySpecCheckpoint({ entryId: value.id, ids, trackId, verify: spec });
          }
        } else {
          validateVerifySpecCheckpoint({ entryId: value.id, ids, verify });
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

export const trackSchema = z.object({
  id: z
    .string()
    .min(1)
    .regex(/^[a-z0-9][a-z0-9_-]*$/i, "Use a stable id like py, ts, or rust."),
  label: z.string().min(1),
});

export type TutorialTrack = z.infer<typeof trackSchema>;
export type TrackMap<T> = Record<string, T>;
export type TrackScoped<T> = T | TrackMap<T>;

export const verifyByTrackSchema = z.record(verifySchema);
export const trackScopedVerifySchema = z.union([verifySchema, verifyByTrackSchema]);

export const starterByTrackSchema = z.record(starterSchema);
export const trackScopedStarterSchema = z.union([starterSchema, starterByTrackSchema]);

export type TrackScopedVerifySpec = z.infer<typeof trackScopedVerifySchema>;
export type TrackScopedStarterSpec = z.infer<typeof trackScopedStarterSchema>;

export function resolveForTrack<T>(
  value: TrackScoped<T> | undefined,
  trackId: string | undefined,
  isShared: (v: unknown) => v is T,
): T | undefined {
  if (!value) return undefined;
  if (isShared(value)) return value;
  return trackId ? value[trackId] : undefined;
}

export function resolveStarterForTrack(
  starter: TrackScoped<StarterSpec> | undefined,
  trackId: string | undefined,
): StarterSpec | undefined {
  return resolveForTrack(starter, trackId, isStarterSpec);
}

export function resolveVerifyForTrack(
  verify: TrackScoped<VerifySpec> | undefined,
  trackId: string | undefined,
): VerifySpec | undefined {
  return resolveForTrack(verify, trackId, isVerifySpec);
}

function parseStepCollectionId(id: string): { tutorialSlug: string; stepFile: string } {
  const slash = id.indexOf("/");
  if (slash < 0) {
    throw new Error(`Unrecognized step id: ${id}`);
  }
  return { tutorialSlug: id.slice(0, slash), stepFile: id.slice(slash + 1) };
}

function refineTrackConfig(
  data: {
    tracks?: TutorialTrack[];
    defaultTrack?: string;
    starter?: TrackScoped<StarterSpec>;
  },
  ctx: z.RefinementCtx,
) {
  const trackIds = data.tracks?.map((track) => track.id) ?? [];
  const duplicated = trackIds.filter((id, index) => trackIds.indexOf(id) !== index);
  for (const id of new Set(duplicated)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["tracks"],
      message: `Duplicate track id "${id}".`,
    });
  }
  if (data.defaultTrack && !trackIds.includes(data.defaultTrack)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["defaultTrack"],
      message: `defaultTrack "${data.defaultTrack}" is not declared in tracks.`,
    });
  }
  if (isTrackMap(data.starter, isStarterSpec)) {
    const actual = Object.keys(data.starter);
    const unknown = actual.filter((id) => !trackIds.includes(id));
    const missing = trackIds.filter((id) => !(id in data.starter!));
    if (trackIds.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["starter"],
        message: "Per-track starter requires declared tracks.",
      });
    }
    for (const id of unknown) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["starter", id],
        message: `Unknown starter track "${id}".`,
      });
    }
    if (missing.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["starter"],
        message: `Missing starter for track(s): ${missing.join(", ")}.`,
      });
    }
  }
}

/** Schema for tutorial step entries. Pass through Astro's image() helper. */
export function stepsSchema({ image }: { image: () => import("astro/zod").ZodType }) {
  return z.object({
    title: z.string(),
    duration: z.string().optional(),
    summary: z.string().optional(),
    ai: z.boolean().optional(),
    heroMedia: createHeroMediaSchema(z, image).optional(),
    verify: trackScopedVerifySchema.optional(),
  });
}

/** Schema for tutorial entries. Pass through Astro's image() helper. */
export function tutorialsSchema({ image }: { image: () => import("astro/zod").ZodType }) {
  return z
    .object({
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
      tracks: z.array(trackSchema).default([]),
      defaultTrack: z.string().min(1).optional(),
      difficulty: z.enum(["beginner", "intermediate", "advanced"]).default("beginner"),
      estimatedDuration: z.string().optional(),
      prerequisites: z.array(z.string()).default([]),
      nextTutorial: z.string().optional(),
      cover: image().optional(),
      icon: createTutorialIconSchema(z, image).optional(),
      steps: z.array(z.string()).optional(),
      gated: z.boolean().default(false),
      showProgress: z.boolean().default(true),
      feedbackUrl: z.string().url().optional(),
      starter: trackScopedStarterSchema.optional(),
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
    })
    .superRefine(refineTrackConfig);
}
