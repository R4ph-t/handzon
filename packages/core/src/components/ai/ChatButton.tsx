import { Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ASSIST_EVENT, ASSIST_READY_EVENT, type AssistEventDetail } from "../../lib/ai/assist";
import type { ChatMessage } from "../../lib/ai/client";
import type { AssistantContext } from "../../lib/ai/context";
import { buildAssistantPrompt } from "../../lib/ai/prompts";
import { useProgress } from "../../lib/progress/useProgress";
import { stripInactiveTrackBlocks } from "../../lib/track-source";
import { resolveActiveTrack } from "../../lib/tracks";
import type { AiConfig } from "../../types/ai";
import ChatPanel from "./ChatPanel";

interface Props {
  config: AiConfig;
  context: AssistantContext;
}

export default function ChatButton({ config, context }: Props) {
  const { state } = useProgress();
  const [open, setOpen] = useState(false);
  const [seed, setSeed] = useState<ChatMessage[] | undefined>(undefined);
  // Bumped on each new assist seed so ChatPanel remounts with the
  // new initialMessages even if the panel is already open from a
  // previous intent or FAB click.
  const [seedToken, setSeedToken] = useState(0);
  const trackContext = useMemo<AssistantContext>(() => {
    const activeTrack = resolveActiveTrack({
      tracks: context.tutorial.tracks,
      preferredTrack: state.prefs.track,
      defaultTrack: context.tutorial.defaultTrack,
    });
    if (!activeTrack) return context;
    return {
      ...context,
      tutorial: { ...context.tutorial, track: activeTrack },
      currentStep: {
        ...context.currentStep,
        source: stripInactiveTrackBlocks(context.currentStep.source, activeTrack),
      },
      priorSteps: context.priorSteps.map((step) => ({
        ...step,
        source: stripInactiveTrackBlocks(step.source, activeTrack),
      })),
    };
  }, [context, state.prefs.track]);

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
      const { seedMessages } = buildAssistantPrompt(trackContext, detail.intent);
      setSeed(seedMessages);
      setSeedToken((t) => t + 1);
      setOpen(true);
    }
    document.addEventListener(ASSIST_EVENT, onAssist);
    return () => document.removeEventListener(ASSIST_EVENT, onAssist);
  }, [trackContext]);

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
        context={trackContext}
        initialMessages={seed}
      />
    </>
  );
}
