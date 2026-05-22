import { eq } from "drizzle-orm";
import {
  getStep,
  getStepsForTutorial,
  getTutorialBySlug,
  getTutorials,
  parseStepId,
} from "../../lib/content.ts";
import { getDb } from "../db/client.ts";
import { progressEntries } from "../db/schema.ts";
import { type McpTool, text } from "./protocol.ts";
import { progressWriteTools, verificationTools } from "./writeTools.ts";

/**
 * Pull the first <Checkpoint label="…"> from a step body so the
 * agent can surface the prose criterion when there's no machine-
 * verifiable spec to run. Returns undefined when no Checkpoint or
 * no label attribute is present.
 */
function extractCheckpointLabel(body: string): string | undefined {
  const m = /<Checkpoint\b[^>]*\blabel\s*=\s*(?:"([^"]+)"|'([^']+)'|\{`([^`]+)`\})/.exec(body);
  if (!m) return undefined;
  return m[1] ?? m[2] ?? m[3];
}

/**
 * Catalog read tools. No auth required beyond a valid bearer token —
 * agents browsing what's available before deciding which tutorial to
 * help with don't need progress:read.
 */
export const catalogReadTools: McpTool[] = [
  {
    name: "list_tutorials",
    description: "List every tutorial published on this Handzon site.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    handler: async () => {
      const tutorials = await getTutorials();
      const rows = tutorials.map((t) => ({
        slug: t.id,
        title: t.data.title,
        description: t.data.description,
        difficulty: t.data.difficulty,
        tags: t.data.tags,
      }));
      return text(JSON.stringify({ tutorials: rows }, null, 2));
    },
  },
  {
    name: "get_tutorial",
    description:
      "Return tutorial metadata + ordered step outline (slug, title, duration) for one tutorial.",
    inputSchema: {
      type: "object",
      properties: { slug: { type: "string", minLength: 1 } },
      required: ["slug"],
      additionalProperties: false,
    },
    handler: async (args) => {
      const { slug } = args as { slug: string };
      const tutorial = await getTutorialBySlug(slug);
      if (!tutorial) {
        return {
          content: [{ type: "text", text: `No tutorial with slug "${slug}".` }],
          isError: true,
        };
      }
      const steps = await getStepsForTutorial(slug);
      const payload = {
        slug: tutorial.id,
        title: tutorial.data.title,
        description: tutorial.data.description,
        difficulty: tutorial.data.difficulty,
        tags: tutorial.data.tags,
        gated: tutorial.data.gated,
        steps: steps.map((s) => {
          const { stepSlug, order } = parseStepId(s.id);
          return {
            slug: stepSlug,
            order,
            title: s.data.title,
            summary: s.data.summary,
            duration: s.data.duration,
          };
        }),
      };
      return text(JSON.stringify(payload, null, 2));
    },
  },
  {
    name: "get_step",
    description: "Return one step's full Markdown source + metadata.",
    inputSchema: {
      type: "object",
      properties: {
        tutorial: { type: "string", minLength: 1 },
        step: { type: "string", minLength: 1 },
      },
      required: ["tutorial", "step"],
      additionalProperties: false,
    },
    handler: async (args) => {
      const { tutorial, step } = args as { tutorial: string; step: string };
      const tut = await getTutorialBySlug(tutorial);
      if (!tut) {
        return {
          content: [{ type: "text", text: `No tutorial with slug "${tutorial}".` }],
          isError: true,
        };
      }
      const stepEntry = await getStep(tutorial, step);
      if (!stepEntry) {
        return {
          content: [{ type: "text", text: `No step "${step}" in "${tutorial}".` }],
          isError: true,
        };
      }
      const { stepSlug, order } = parseStepId(stepEntry.id);
      const body = stepEntry.body ?? "";
      const verifySpec = (stepEntry.data as { verify?: unknown }).verify;
      const payload = {
        tutorial,
        slug: stepSlug,
        order,
        title: stepEntry.data.title,
        summary: stepEntry.data.summary,
        duration: stepEntry.data.duration,
        source: body,
        verify: verifySpec ?? null,
        // Prose-fallback: when no verify block is declared, surface the
        // <Checkpoint label="…"> text so the agent can self-attest the
        // criterion before calling complete_checkpoint.
        checkpointCriterion: verifySpec ? null : (extractCheckpointLabel(body) ?? null),
      };
      return text(JSON.stringify(payload, null, 2));
    },
  },
];

/**
 * Authenticated read tools. Available to any valid bearer token (no
 * `requiredScope` because reading your own progress is implicit in
 * holding a PAT for the account).
 */
export const progressReadTools: McpTool[] = [
  {
    name: "get_progress",
    description: "Return every progress entry for the authenticated learner.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    handler: async (_args, ctx) => {
      if (!ctx.learnerId) {
        return {
          content: [{ type: "text", text: "No resolved learner — bearer token required." }],
          isError: true,
        };
      }
      const db = getDb();
      const rows = await db
        .select()
        .from(progressEntries)
        .where(eq(progressEntries.learnerId, ctx.learnerId));
      return text(JSON.stringify({ entries: rows }, null, 2));
    },
  },
];

/**
 * Default tool bundle the scaffold mounts. Order matters for the
 * tools/list response — clients usually surface them in array order.
 */
export const defaultTools: McpTool[] = [
  ...catalogReadTools,
  ...progressReadTools,
  ...progressWriteTools,
  ...verificationTools,
];
