export const aiDefaults = {
  enabled: true,
  name: "Helper",
  tagline: undefined as string | undefined,
  greeting: undefined as string | undefined,
  avatar: undefined as string | undefined,
  persona: undefined as string | undefined,
  provider: "anthropic" as "anthropic" | "openai" | "google" | "openai-compatible",
  model: "claude-sonnet-4-5",
  byok: "required" as "required" | "optional" | "disabled",
  tone: "socratic" as "socratic" | "direct" | "encouraging",
  contextBudgetTokens: 8000,
  includeFutureSteps: false,
  tools: { suggestPlaygroundEdit: false },
};

export type AiConfig = typeof aiDefaults;
