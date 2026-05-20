import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export interface AssistantPayload {
  tutorial: {
    slug: string;
    title: string;
    description: string;
    difficulty: string;
    tags: string[];
  };
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
 * Mastra 1.x passes the validated input directly as the first arg.
 */
export function buildTools(payload: AssistantPayload) {
  return {
    getStep: createTool({
      id: "getStep",
      description: "Fetch the full markdown source of any step in this tutorial by its slug.",
      inputSchema: z.object({ slug: z.string() }),
      execute: async (input: { slug: string }) => {
        const target =
          payload.currentStep.slug === input.slug
            ? payload.currentStep
            : payload.priorSteps.find((s) => s.slug === input.slug);
        if (!target) return { error: `No step "${input.slug}" available in context.` };
        return { slug: target.slug, title: target.title, source: target.source };
      },
    }),

    getStepCodeBlocks: createTool({
      id: "getStepCodeBlocks",
      description: "Fetch just the code blocks from a step. Cheaper than getStep.",
      inputSchema: z.object({ slug: z.string(), lang: z.string().optional() }),
      execute: async (input: { slug: string; lang?: string }) => {
        const target =
          payload.currentStep.slug === input.slug
            ? payload.currentStep
            : payload.priorSteps.find((s) => s.slug === input.slug);
        if (!target) return { error: `No step "${input.slug}" available.` };
        const blocks: Array<{ lang: string; code: string }> = [];
        const re = /```([a-zA-Z0-9_+-]*)\s*(?:[^\n]*\n)([\s\S]*?)```/g;
        for (const m of target.source.matchAll(re)) {
          const matchLang = m[1] ?? "text";
          const code = m[2] ?? "";
          if (!input.lang || matchLang === input.lang) {
            blocks.push({ lang: matchLang || "text", code });
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
      execute: async (input: { query: string }) => {
        const q = input.query.toLowerCase();
        const hits = payload.references
          .map((r) => ({
            source: r.source,
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
      execute: async (input: { query: string; lang?: string }) => {
        const allSteps = [payload.currentStep, ...payload.priorSteps];
        const q = input.query.toLowerCase();
        const hits: Array<{ stepSlug: string; lang: string; snippet: string }> = [];
        const re = /```([a-zA-Z0-9_+-]*)\s*(?:[^\n]*\n)([\s\S]*?)```/g;
        for (const step of allSteps) {
          for (const m of step.source.matchAll(re)) {
            const matchLang = m[1] ?? "text";
            const code = m[2] ?? "";
            if (input.lang && matchLang !== input.lang) continue;
            if (code.toLowerCase().includes(q)) {
              hits.push({ stepSlug: step.slug, lang: matchLang, snippet: code.slice(0, 280) });
            }
          }
        }
        return { hits };
      },
    }),

    getProgress: createTool({
      id: "getProgress",
      description:
        "The learner's current progress snapshot (completed steps, quizzes, checkpoints).",
      inputSchema: z.object({}),
      execute: async () => ({ progress: payload.progress }),
    }),

    fetchUrl: createTool({
      id: "fetchUrl",
      description: "Fetch the body of a URL. Restricted to the tutorial's allowedDomains list.",
      inputSchema: z.object({ url: z.string().url() }),
      execute: async (input: { url: string }) => {
        if (payload.allowedDomains.length === 0) {
          return { error: "fetchUrl is disabled (no allowedDomains configured)." };
        }
        let host: string;
        try {
          host = new URL(input.url).hostname;
        } catch {
          return { error: "Invalid URL." };
        }
        if (!payload.allowedDomains.some((d) => host === d || host.endsWith(`.${d}`))) {
          return { error: `Domain "${host}" not in allowedDomains.` };
        }
        const res = await fetch(input.url);
        if (!res.ok) return { error: `HTTP ${res.status}` };
        const text = await res.text();
        return { content: text.slice(0, 8000) };
      },
    }),
  };
}
