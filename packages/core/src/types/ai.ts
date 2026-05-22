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
  /**
   * When true, the tutorial layout renders a "Stuck on this step?"
   * footer under every step body so authors don't have to drop a
   * <HelpMe /> by hand. Off by default.
   */
  autoStepHelp?: boolean;
  disabledSkills?: string[];
  allowedDomains?: string[];
}
