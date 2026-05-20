import { Sparkles } from "lucide-react";
import { useState } from "react";
import type { AiConfig } from "~/config/ai";
import type { AssistantContext } from "~/lib/ai/context";
import ChatPanel from "./ChatPanel";

interface Props {
  config: AiConfig & { disabledSkills?: string[]; allowedDomains?: string[] };
  context: AssistantContext;
}

export default function ChatButton({ config, context }: Props) {
  const [open, setOpen] = useState(false);
  if (!config.enabled) return null;

  return (
    <>
      <button
        type="button"
        className="chat-fab"
        onClick={() => setOpen(true)}
        aria-label={`Open ${config.name}`}
      >
        <Sparkles size={18} aria-hidden="true" />
        <span>{config.name}</span>
      </button>
      <ChatPanel open={open} onOpenChange={setOpen} config={config} context={context} />
    </>
  );
}
