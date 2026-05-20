import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export type ProviderName = "anthropic" | "openai" | "google" | "openai-compatible";

/**
 * Pick the model binding for a given provider + model + optional BYOK key.
 * Falls back to env var keys when learnerKey is undefined.
 */
export function pickModel(provider: ProviderName, model: string, learnerKey?: string) {
  switch (provider) {
    case "anthropic": {
      const anthropic = createAnthropic({ apiKey: learnerKey ?? process.env.ANTHROPIC_API_KEY });
      return anthropic(model);
    }
    case "openai": {
      const openai = createOpenAI({ apiKey: learnerKey ?? process.env.OPENAI_API_KEY });
      return openai(model);
    }
    case "google": {
      const google = createGoogleGenerativeAI({
        apiKey: learnerKey ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY,
      });
      return google(model);
    }
    case "openai-compatible": {
      const baseURL = process.env.OPENAI_COMPATIBLE_BASE_URL ?? "https://api.groq.com/openai/v1";
      const compat = createOpenAICompatible({
        name: "compat",
        baseURL,
        apiKey: learnerKey ?? process.env.OPENAI_COMPATIBLE_API_KEY,
      });
      return compat(model);
    }
  }
}
