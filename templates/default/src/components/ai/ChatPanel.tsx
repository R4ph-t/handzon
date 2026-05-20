import * as Dialog from "@radix-ui/react-dialog";
import { Send, Settings, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { AiConfig } from "~/config/ai";
import { type ChatMessage, clearLearnerKey, loadLearnerKey, streamChat } from "~/lib/ai/client";
import type { AssistantContext } from "~/lib/ai/context";
import ByokSetup from "./ByokSetup";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: AiConfig & { disabledSkills?: string[]; allowedDomains?: string[] };
  context: AssistantContext;
}

export default function ChatPanel({ open, onOpenChange, config, context }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (config.greeting) {
      return [{ role: "assistant", content: config.greeting }];
    }
    return [
      {
        role: "assistant",
        content: `Hi, I'm ${config.name}. Ask me anything about "${context.tutorial.title}". I can see what step you're on.`,
      },
    ];
  });
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [byokOpen, setByokOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, []);

  async function send() {
    const trimmed = input.trim();
    if (!trimmed || streaming) return;

    const learnerKey = loadLearnerKey(config.provider);
    if (config.byok === "required" && !learnerKey) {
      setByokOpen(true);
      return;
    }

    const next: ChatMessage[] = [...messages, { role: "user", content: trimmed }];
    setMessages(next);
    setInput("");
    setStreaming(true);
    setError(null);

    abortRef.current = new AbortController();
    try {
      const stream = await streamChat({
        messages: next,
        config,
        context,
        learnerKey: learnerKey ?? undefined,
        signal: abortRef.current.signal,
      });
      let acc = "";
      setMessages((m) => [...m, { role: "assistant", content: "" }]);
      const reader = stream.getReader();
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += value;
        setMessages((m) => {
          const copy = m.slice();
          copy[copy.length - 1] = { role: "assistant", content: acc };
          return copy;
        });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
    } finally {
      setStreaming(false);
    }
  }

  function clear() {
    setMessages([]);
    setError(null);
  }

  function resetKey() {
    clearLearnerKey(config.provider);
    setByokOpen(true);
  }

  return (
    <>
      <Dialog.Root open={open} onOpenChange={onOpenChange}>
        <Dialog.Portal>
          <Dialog.Overlay className="ms-overlay" />
          <Dialog.Content className="chat-panel" aria-describedby={undefined}>
            <header className="chat-head">
              <div>
                <Dialog.Title className="chat-title">{config.name}</Dialog.Title>
                {config.tagline && <div className="chat-tagline">{config.tagline}</div>}
              </div>
              <div className="chat-head-actions">
                <button type="button" title="Reset key" onClick={resetKey}>
                  <Settings size={16} />
                </button>
                <button type="button" title="Clear chat" onClick={clear}>
                  <Trash2 size={16} />
                </button>
                <Dialog.Close asChild>
                  <button type="button" aria-label="Close">
                    <X size={16} />
                  </button>
                </Dialog.Close>
              </div>
            </header>

            <div className="chat-meta">
              On: <strong>{context.currentStep.title}</strong>
            </div>

            <div className="chat-list" ref={listRef}>
              {messages.map((m, i) => (
                <div key={i} className={`chat-msg chat-msg-${m.role}`}>
                  <span className="chat-role">{m.role === "user" ? "You" : config.name}</span>
                  <div className="chat-content">{m.content}</div>
                </div>
              ))}
              {streaming && <div className="chat-typing">…</div>}
              {error && <div className="chat-error">⚠ {error}</div>}
            </div>

            <form
              className="chat-input"
              onSubmit={(e) => {
                e.preventDefault();
                void send();
              }}
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`Ask ${config.name}…`}
                disabled={streaming}
              />
              <button type="submit" disabled={streaming || !input.trim()} aria-label="Send">
                <Send size={16} />
              </button>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <ByokSetup
        open={byokOpen}
        onOpenChange={setByokOpen}
        provider={config.provider}
        assistantName={config.name}
        onKeySaved={() => {}}
      />
    </>
  );
}
