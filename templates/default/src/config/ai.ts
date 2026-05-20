import type { AiConfig } from "@handzon/ui";

export const aiDefaults: AiConfig = {
  enabled: true,
  name: "Helper",
  tagline: undefined,
  greeting: undefined,
  avatar: undefined,
  persona: undefined,
  provider: "anthropic",
  model: "claude-sonnet-4-5",
  byok: "required",
  tone: "socratic",
  contextBudgetTokens: 8000,
  includeFutureSteps: false,
  tools: { suggestPlaygroundEdit: false },
};

export type { AiConfig };
