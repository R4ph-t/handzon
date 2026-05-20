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

const FETCH_TIMEOUT_MS = 5_000;
const FETCH_MAX_BYTES = 64 * 1024;
const CODE_FENCE = /```([a-zA-Z0-9_+-]*)\s*(?:[^\n]*\n)([\s\S]*?)```/g;

/**
 * Pull every fenced code block out of a markdown string. Single source of
 * truth for the regex so getStepCodeBlocks and searchCodeBlocks can't
 * drift.
 */
function extractCodeBlocks(source: string): Array<{ lang: string; code: string }> {
  const blocks: Array<{ lang: string; code: string }> = [];
  for (const m of source.matchAll(CODE_FENCE)) {
    blocks.push({ lang: m[1] || "text", code: m[2] ?? "" });
  }
  return blocks;
}

/**
 * Fetch with a timeout and a hard byte cap. Reads the response stream
 * incrementally and aborts if the response exceeds FETCH_MAX_BYTES,
 * rather than waiting for the full body before slicing.
 */
async function fetchBounded(url: string): Promise<string> {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ac.signal, redirect: "follow" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    if (!res.body) return "";
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let received = 0;
    let out = "";
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      received += value.byteLength;
      if (received > FETCH_MAX_BYTES) {
        ac.abort();
        out += decoder.decode(value, { stream: false }).slice(0, FETCH_MAX_BYTES - out.length);
        break;
      }
      out += decoder.decode(value, { stream: true });
    }
    return out;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Build the assistant's tool set. Each tool reads from the per-request
 * payload — tools are pure functions over the context the client sent.
 * Mastra 1.x passes the validated input directly as the first arg.
 */
export function buildTools(payload: AssistantPayload) {
  const findStep = (slug: string) =>
    payload.currentStep.slug === slug
      ? payload.currentStep
      : payload.priorSteps.find((s) => s.slug === slug);

  return {
    getStep: createTool({
      id: "getStep",
      description: "Fetch the full markdown source of any step in this tutorial by its slug.",
      inputSchema: z.object({ slug: z.string() }),
      execute: async (input: { slug: string }) => {
        const target = findStep(input.slug);
        if (!target) return { error: `No step "${input.slug}" available in context.` };
        return { slug: target.slug, title: target.title, source: target.source };
      },
    }),

    getStepCodeBlocks: createTool({
      id: "getStepCodeBlocks",
      description: "Fetch just the code blocks from a step. Cheaper than getStep.",
      inputSchema: z.object({ slug: z.string(), lang: z.string().optional() }),
      execute: async (input: { slug: string; lang?: string }) => {
        const target = findStep(input.slug);
        if (!target) return { error: `No step "${input.slug}" available.` };
        const blocks = extractCodeBlocks(target.source).filter(
          (b) => !input.lang || b.lang === input.lang,
        );
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
      inputSchema: z.object({
        query: z.string(),
        limit: z.number().int().min(1).max(50).optional(),
      }),
      execute: async (input: { query: string; limit?: number }) => {
        const q = input.query.toLowerCase();
        const limit = input.limit ?? 20;
        const hits: Array<{ source: string; line: string }> = [];
        for (const ref of payload.references) {
          for (const line of ref.content.split("\n")) {
            if (line.toLowerCase().includes(q)) {
              hits.push({ source: ref.source, line });
              if (hits.length >= limit) return { hits };
            }
          }
        }
        return { hits };
      },
    }),

    searchCodeBlocks: createTool({
      id: "searchCodeBlocks",
      description: "Keyword search across every code block in this tutorial.",
      inputSchema: z.object({ query: z.string(), lang: z.string().optional() }),
      execute: async (input: { query: string; lang?: string }) => {
        const q = input.query.toLowerCase();
        const hits: Array<{ stepSlug: string; lang: string; snippet: string }> = [];
        for (const step of [payload.currentStep, ...payload.priorSteps]) {
          for (const block of extractCodeBlocks(step.source)) {
            if (input.lang && block.lang !== input.lang) continue;
            if (block.code.toLowerCase().includes(q)) {
              hits.push({
                stepSlug: step.slug,
                lang: block.lang,
                snippet: block.code.slice(0, 280),
              });
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
        let parsed: URL;
        try {
          parsed = new URL(input.url);
        } catch {
          return { error: "Invalid URL." };
        }
        if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
          return { error: `Unsupported scheme "${parsed.protocol}".` };
        }
        const host = parsed.hostname;
        if (!payload.allowedDomains.some((d) => host === d || host.endsWith(`.${d}`))) {
          return { error: `Domain "${host}" not in allowedDomains.` };
        }
        try {
          const content = await fetchBounded(input.url);
          return { content };
        } catch (e) {
          return { error: e instanceof Error ? e.message : String(e) };
        }
      },
    }),
  };
}
