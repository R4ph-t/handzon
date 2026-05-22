import { useEffect, useState } from "react";
import type { AssistantIntent } from "./prompts";

/**
 * Document-scoped event that Family A touchpoints (HelpMe, quiz wrong
 * answer, checkpoint nudge, selection ask, playground fix, step
 * footer) dispatch to ask the in-app tutor to open with a pre-seeded
 * intent. ChatButton is the single listener — it owns the context
 * and config needed to render the intent into seedMessages.
 */
export const ASSIST_EVENT = "handzon:assist";

/**
 * Dispatched by ChatButton once on mount, and reflected as
 * `document.documentElement.dataset.handzonAi = "ready"` for islands
 * that mount after the chat (read the flag) or before (await the
 * event). Family A islands use `useAiEnabled()` to hide themselves
 * when the tutor isn't on this page.
 */
export const ASSIST_READY_EVENT = "handzon:ai-ready";

export interface AssistEventDetail {
  intent: AssistantIntent;
}

/**
 * Fire a touchpoint intent. ChatButton receives, builds the prompt
 * with the live AssistantContext it already holds, and opens the
 * panel with the seed user turn.
 */
export function dispatchAssist(intent: AssistantIntent): void {
  if (typeof document === "undefined") return;
  const detail: AssistEventDetail = { intent };
  document.dispatchEvent(new CustomEvent(ASSIST_EVENT, { detail }));
}

/**
 * Reactive flag: is the in-app tutor mounted on this page? Family A
 * islands return null when false so the affordance is hidden
 * entirely when `aiConfig.enabled === false`.
 */
export function useAiEnabled(): boolean {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    if (document.documentElement.dataset.handzonAi === "ready") {
      setEnabled(true);
      return;
    }
    const onReady = () => setEnabled(true);
    document.addEventListener(ASSIST_READY_EVENT, onReady);
    return () => document.removeEventListener(ASSIST_READY_EVENT, onReady);
  }, []);
  return enabled;
}
