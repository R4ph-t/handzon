import {
  getStep,
  getStepsForTutorial,
  getTutorialBySlug,
  getTutorials,
  parseStepId,
} from "../../lib/content.ts";
import { type McpTool, text } from "./protocol.ts";

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
      const payload = {
        tutorial,
        slug: stepSlug,
        order,
        title: stepEntry.data.title,
        summary: stepEntry.data.summary,
        duration: stepEntry.data.duration,
        source: stepEntry.body ?? "",
      };
      return text(JSON.stringify(payload, null, 2));
    },
  },
];
