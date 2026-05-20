export interface AiConfig {
  enabled: boolean;
  name: string;
  tagline?: string;
  greeting?: string;
  avatar?: string;
  persona?: string;
  provider: "anthropic" | "openai" | "google" | "openai-compatible";
  model: string;
  byok: "required" | "optional" | "disabled";
  tone: "socratic" | "direct" | "encouraging";
  contextBudgetTokens: number;
  includeFutureSteps: boolean;
  tools: { suggestPlaygroundEdit: boolean };
  disabledSkills?: string[];
  allowedDomains?: string[];
}
