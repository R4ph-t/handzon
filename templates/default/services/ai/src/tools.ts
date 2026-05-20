import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export interface AssistantPayload {
  tutorial: { slug: string; title: string; description: string; difficulty: string; tags: string[] };
  outline: Array<{ slug: string; title: string; completed: boolean; current: boolean }>;
  currentStep: { slug: string; title: string; source: string };
  priorSteps: Array<{ slug: string; title: string; source: string }>;
  progress: {
    completed: string[];
    quizzes: Array<{ id: string; correct: boolean }>;
    checkpoints: string[];
  };
  references: Array<{ source: string; content: string }>;
  allowedDomains: string[];
}

/**
 * Build the assistant's tool set. Each tool reads from the per-request
 * payload — tools are pure functions over the context the client sent.
 */
export function buildTools(payload: AssistantPayload) {
  return {
    getStep: createTool({
      id: "getStep",
      description: "Fetch the full markdown source of any step in this tutorial by its slug.",
      inputSchema: z.object({ slug: z.string() }),
      execute: async ({ context }) => {
        const target =
          payload.currentStep.slug === context.slug
            ? payload.currentStep
            : payload.priorSteps.find((s) => s.slug === context.slug);
        if (!target) return { error: `No step "${context.slug}" available in context.` };
        return { slug: target.slug, title: target.title, source: target.source };
      },
    }),

    getStepCodeBlocks: createTool({
      id: "getStepCodeBlocks",
      description: "Fetch just the code blocks from a step. Cheaper than getStep.",
      inputSchema: z.object({ slug: z.string(), lang: z.string().optional() }),
      execute: async ({ context }) => {
        const target =
          payload.currentStep.slug === context.slug
            ? payload.currentStep
            : payload.priorSteps.find((s) => s.slug === context.slug);
        if (!target) return { error: `No step "${context.slug}" available.` };
        const blocks: Array<{ lang: string; code: string }> = [];
        const re = /```([a-zA-Z0-9_+-]*)\s*(?:[^\n]*\n)([\s\S]*?)```/g;
        let m: RegExpExecArray | null;
        while ((m = re.exec(target.source))) {
          if (!context.lang || m[1] === context.lang) {
            blocks.push({ lang: m[1] || "text", code: m[2] });
          }
        }
        return { blocks };
      },
    }),

    getOutline: createTool({
      id: "getOutline",
      description: "List all steps in this tutorial with completion + current markers.",
      inputSchema: z.object({}),
      execute: async () => ({ outline: payload.outline }),
    }),

    getNextStep: createTool({
      id: "getNextStep",
      description: "Return the step after the current one, if any.",
      inputSchema: z.object({}),
      execute: async () => {
        const idx = payload.outline.findIndex((s) => s.current);
        return idx >= 0 && idx < payload.outline.length - 1
          ? { next: payload.outline[idx + 1] }
          : { next: null };
      },
    }),

    getPreviousStep: createTool({
      id: "getPreviousStep",
      description: "Return the step before the current one, if any.",
      inputSchema: z.object({}),
      execute: async () => {
        const idx = payload.outline.findIndex((s) => s.current);
        return idx > 0 ? { previous: payload.outline[idx - 1] } : { previous: null };
      },
    }),

    getTutorialMeta: createTool({
      id: "getTutorialMeta",
      description: "Return the tutorial's _meta.json contents (title, difficulty, tags, etc.).",
      inputSchema: z.object({}),
      execute: async () => ({ meta: payload.tutorial }),
    }),

    searchReferences: createTool({
      id: "searchReferences",
      description: "Keyword search across the author-configured reference docs.",
      inputSchema: z.object({ query: z.string() }),
      execute: async ({ context }) => {
        const q = context.query.toLowerCase();
        const hits = payload.references
          .map((r) => ({
            source: r.source,
            // surface the line containing the match
            line: r.content.split("\n").find((l) => l.toLowerCase().includes(q)) ?? "",
          }))
          .filter((h) => h.line);
        return { hits };
      },
    }),

    searchCodeBlocks: createTool({
      id: "searchCodeBlocks",
      description: "Keyword search across every code block in this tutorial.",
      inputSchema: z.object({ query: z.string(), lang: z.string().optional() }),
      execute: async ({ context }) => {
        const allSteps = [payload.currentStep, ...payload.priorSteps];
        const q = context.query.toLowerCase();
        const hits: Array<{ stepSlug: string; lang: string; snippet: string }> = [];
        const re = /```([a-zA-Z0-9_+-]*)\s*(?:[^\n]*\n)([\s\S]*?)```/g;
        for (const step of allSteps) {
          let m: RegExpExecArray | null;
          while ((m = re.exec(step.source))) {
            const lang = m[1] || "text";
            if (context.lang && lang !== context.lang) continue;
            if (m[2].toLowerCase().includes(q)) {
              hits.push({ stepSlug: step.slug, lang, snippet: m[2].slice(0, 280) });
            }
          }
        }
        return { hits };
      },
    }),

    getProgress: createTool({
      id: "getProgress",
      description: "The learner's current progress snapshot (completed steps, quizzes, checkpoints).",
      inputSchema: z.object({}),
      execute: async () => ({ progress: payload.progress }),
    }),

    fetchUrl: createTool({
      id: "fetchUrl",
      description: "Fetch the body of a URL. Restricted to the tutorial's allowedDomains list.",
      inputSchema: z.object({ url: z.string().url() }),
      execute: async ({ context }) => {
        if (payload.allowedDomains.length === 0) {
          return { error: "fetchUrl is disabled (no allowedDomains configured)." };
        }
        let host: string;
        try {
          host = new URL(context.url).hostname;
        } catch {
          return { error: "Invalid URL." };
        }
        if (!payload.allowedDomains.some((d) => host === d || host.endsWith(`.${d}`))) {
          return { error: `Domain "${host}" not in allowedDomains.` };
        }
        const res = await fetch(context.url);
        if (!res.ok) return { error: `HTTP ${res.status}` };
        const text = await res.text();
        return { content: text.slice(0, 8000) };
      },
    }),
  };
}
