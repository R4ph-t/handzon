import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { ASSIST_EVENT, ASSIST_READY_EVENT, type AssistEventDetail } from "../../lib/ai/assist";
import type { ChatMessage } from "../../lib/ai/client";
import type { AssistantContext } from "../../lib/ai/context";
import { buildAssistantPrompt } from "../../lib/ai/prompts";
import type { AiConfig } from "../../types/ai";
import ChatPanel from "./ChatPanel";

interface Props {
  config: AiConfig;
  context: AssistantContext;
}

export default function ChatButton({ config, context }: Props) {
  const [open, setOpen] = useState(false);
  const [seed, setSeed] = useState<ChatMessage[] | undefined>(undefined);
  // Bumped on each new assist seed so ChatPanel remounts with the
  // new initialMessages even if the panel is already open from a
  // previous intent or FAB click.
  const [seedToken, setSeedToken] = useState(0);

  // Tell Family A islands (HelpMe, Checkpoint nudge, …) that the tutor
  // is mounted on this page. Set the dataset flag for islands that
  // hydrate after us; dispatch the event for islands that hydrated
  // before us and are waiting.
  useEffect(() => {
    document.documentElement.dataset.handzonAi = "ready";
    document.documentElement.dataset.handzonAiTools = JSON.stringify(config.tools ?? {});
    document.dispatchEvent(new CustomEvent(ASSIST_READY_EVENT));
    return () => {
      delete document.documentElement.dataset.handzonAi;
      delete document.documentElement.dataset.handzonAiTools;
    };
  }, [config.tools]);

  // Listen for touchpoint dispatches and open the panel with the
  // matching seedMessages.
  useEffect(() => {
    function onAssist(e: Event) {
      const detail = (e as CustomEvent<AssistEventDetail>).detail;
      if (!detail?.intent) return;
      const { seedMessages } = buildAssistantPrompt(context, detail.intent);
      setSeed(seedMessages);
      setSeedToken((t) => t + 1);
      setOpen(true);
    }
    document.addEventListener(ASSIST_EVENT, onAssist);
    return () => document.removeEventListener(ASSIST_EVENT, onAssist);
  }, [context]);

  if (!config.enabled) return null;

  return (
    <>
      <button
        type="button"
        className="chat-fab"
        onClick={() => {
          setSeed(undefined);
          setOpen(true);
        }}
        aria-label={`Open ${config.name}`}
      >
        <Sparkles size={18} aria-hidden="true" />
        <span>{config.name}</span>
      </button>
      <ChatPanel
        key={seedToken}
        open={open}
        onOpenChange={setOpen}
        config={config}
        context={context}
        initialMessages={seed}
      />
    </>
  );
}
