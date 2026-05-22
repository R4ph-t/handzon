/**
 * Handzon framework — public API surface.
 *
 * .astro and .tsx components are NOT re-exported here; consumers import
 * them by subpath (e.g. `import BaseLayout from "handzon-core/layouts/BaseLayout.astro"`).
 * Astro can only resolve `.astro` files through the package's `exports`
 * map, not through a barrel re-export, so this file ships only TS values
 * and types.
 */

// AI client (browser-side BYOK + streaming chat to handzon-ai).
export {
  type ChatMessage,
  clearLearnerKey,
  loadLearnerKey,
  saveLearnerKey,
  streamChat,
} from "./lib/ai/client.ts";
export { type AssistantContext, buildContext } from "./lib/ai/context.ts";
export {
  type AssistantIntent,
  type AssistantPrompt,
  buildAssistantPrompt,
} from "./lib/ai/prompts.ts";
// Content collection helpers (built on top of astro:content).
export {
  getStep,
  getStepsForTutorial,
  getTutorialBySlug,
  getTutorials,
  parseStepId,
  type StepEntry,
  sumDurations,
  type TutorialEntry,
} from "./lib/content.ts";
// MDX component map used by .astro pages rendering tutorial content.
export { mdxComponents } from "./lib/mdx-components.ts";
// Progress store (localStorage + optional server sync).
export { getStore } from "./lib/progress/local.ts";
export {
  emptyState,
  type LastVisitedEntry,
  type ProgressState,
  type ProgressStore,
  type StepKey,
} from "./lib/progress/types.ts";
export {
  useProgress,
  useProgressAfterMount,
} from "./lib/progress/useProgress.ts";
// Rehype plugin that lets Mermaid code fences round-trip as <pre class="mermaid">.
export { default as rehypeMermaidPassthrough } from "./lib/rehype-mermaid-passthrough.ts";

// AI config type (consumers provide concrete values; framework consumes shape).
export type { AiConfig } from "./types/ai.ts";
