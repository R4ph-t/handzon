import type { AssistantContext } from "./context";
import type { AiConfig } from "~/config/ai";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequestOptions {
  messages: ChatMessage[];
  config: AiConfig & { disabledSkills?: string[]; allowedDomains?: string[] };
  context: AssistantContext;
  learnerKey?: string;
  signal?: AbortSignal;
}

/**
 * POST to the Mastra service. Reads the service URL from
 * import.meta.env.PUBLIC_AI_SERVICE_URL at build time. Streams plain text
 * chunks via fetch's streaming response body.
 */
export async function streamChat(opts: ChatRequestOptions): Promise<ReadableStream<string>> {
  const serviceUrl = import.meta.env.PUBLIC_AI_SERVICE_URL;
  if (!serviceUrl) throw new Error("PUBLIC_AI_SERVICE_URL is not set.");

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (opts.learnerKey) headers["X-Llm-Api-Key"] = opts.learnerKey;

  const payload = {
    tutorial: opts.context.tutorial,
    outline: opts.context.outline,
    currentStep: opts.context.currentStep,
    priorSteps: opts.context.priorSteps,
    progress: opts.context.progress,
    references: opts.context.references,
    allowedDomains: opts.config.allowedDomains ?? [],
  };

  const res = await fetch(`${serviceUrl.replace(/\/$/, "")}/chat`, {
    method: "POST",
    headers,
    signal: opts.signal,
    body: JSON.stringify({
      messages: opts.messages,
      config: {
        provider: opts.config.provider,
        model: opts.config.model,
        name: opts.config.name,
        tone: opts.config.tone,
        persona: opts.config.persona,
        disabledSkills: opts.config.disabledSkills,
      },
      payload,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Chat service error ${res.status}: ${text}`);
  }
  if (!res.body) throw new Error("No response body from chat service.");

  return res.body.pipeThrough(new TextDecoderStream());
}

const KEY_STORAGE_PREFIX = "tutorial-tool:byok:";

export function loadLearnerKey(provider: string): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(`${KEY_STORAGE_PREFIX}${provider}`);
}

export function saveLearnerKey(provider: string, key: string): void {
  window.localStorage.setItem(`${KEY_STORAGE_PREFIX}${provider}`, key);
}

export function clearLearnerKey(provider: string): void {
  window.localStorage.removeItem(`${KEY_STORAGE_PREFIX}${provider}`);
}
