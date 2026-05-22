import * as Dialog from "@radix-ui/react-dialog";
import { KeyRound, Send, Settings, Sparkles, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { type ChatMessage, clearLearnerKey, loadLearnerKey, streamChat } from "../../lib/ai/client";
import type { AssistantContext } from "../../lib/ai/context";
import type { AiConfig } from "../../types/ai";
import ByokSetup from "./ByokSetup";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: AiConfig;
  context: AssistantContext;
  /**
   * Seed turns prepended after the assistant greeting. Callers that
   * open the panel with a specific intent (HelpMe, quiz "why is this
   * wrong?", checkpoint nudge, …) pass a single user turn here; the
   * panel auto-streams a response once on open. The user-turn body
   * stays editable in history but isn't re-sent on reopen.
   */
  initialMessages?: ChatMessage[];
}

export default function ChatPanel({ open, onOpenChange, config, context, initialMessages }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const greeting: ChatMessage = config.greeting
      ? { role: "assistant", content: config.greeting }
      : {
          role: "assistant",
          content: `Hi, I'm ${config.name}. Ask me anything about "${context.tutorial.title}". I can see what step you're on.`,
        };
    return initialMessages && initialMessages.length > 0
      ? [greeting, ...initialMessages]
      : [greeting];
  });
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [byokOpen, setByokOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Reactive copy of the stored BYOK key so the chat can show / hide its
  // "set up your key" card without waiting for the learner to try to
  // send a message. localStorage isn't readable on the server, hence
  // the mount-time read instead of useState initialiser.
  const [learnerKey, setLearnerKey] = useState<string | null>(null);
  useEffect(() => {
    setLearnerKey(loadLearnerKey(config.provider));
  }, [config.provider]);
  const needsKey = config.byok === "required" && !learnerKey;
  const abortRef = useRef<AbortController | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Keep the latest message in view as chunks stream in (and on every
  // send / clear). Without this, long responses scroll out of frame.
  // The deps aren't read inside the effect — they're triggers, so the
  // effect re-runs when a new chunk arrives or streaming flips. Biome's
  // exhaustive-deps lint would have us remove them; that would break
  // the autoscroll. Keep the suppression scoped to this single effect.
  // biome-ignore lint/correctness/useExhaustiveDependencies: messages + streaming are intentional triggers
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, streaming]);

  async function runStream(next: ChatMessage[]) {
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
      // Delay adding the assistant message until the first chunk
      // arrives so the thinking indicator (shown when the last
      // message is from the user) stays visible during the wait.
      let acc = "";
      let assistantAdded = false;
      const reader = stream.getReader();
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += value;
        if (!assistantAdded) {
          setMessages((m) => [...m, { role: "assistant", content: acc }]);
          assistantAdded = true;
        } else {
          setMessages((m) => {
            const copy = m.slice();
            copy[copy.length - 1] = { role: "assistant", content: acc };
            return copy;
          });
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
    } finally {
      setStreaming(false);
    }
  }

  async function send() {
    const trimmed = input.trim();
    if (!trimmed || streaming) return;

    if (needsKey) {
      setByokOpen(true);
      return;
    }

    const next: ChatMessage[] = [...messages, { role: "user", content: trimmed }];
    setMessages(next);
    setInput("");
    await runStream(next);
  }

  // Help-bridge: when the panel first opens and there's no seed from
  // a Family A touchpoint, fetch pending help requests posted by the
  // agent via MCP and prepend them as user turns. Same one-shot ref
  // as the seed below so subsequent opens don't re-replay them.
  const inboxRef = useRef(false);
  // biome-ignore lint/correctness/useExhaustiveDependencies: open is the trigger
  useEffect(() => {
    if (!open || inboxRef.current) return;
    if (initialMessages && initialMessages.length > 0) return;
    inboxRef.current = true;
    void (async () => {
      try {
        const res = await fetch("/api/help-inbox");
        if (!res.ok) return;
        const data = (await res.json()) as {
          requests?: Array<{ query: string; tutorialSlug: string; stepSlug: string }>;
        };
        const queued = data.requests ?? [];
        if (queued.length === 0) return;
        const turns: ChatMessage[] = queued.map((r) => ({
          role: "user",
          content: `From my agent on ${r.tutorialSlug}/${r.stepSlug}: ${r.query}`,
        }));
        setMessages((prev) => [...prev, ...turns]);
        if (!needsKey) void runStream([...messages, ...turns]);
      } catch {
        /* network error — silently fall back to a normal session */
      }
    })();
  }, [open]);

  // When the panel opens with a pre-seeded user turn (HelpMe, quiz
  // "why is this wrong?", checkpoint nudge, …) auto-trigger the
  // stream once. Gated on `open` so closing + reopening doesn't fire
  // it again, and on a one-shot ref so re-renders during streaming
  // don't either.
  const seededRef = useRef(false);
  // biome-ignore lint/correctness/useExhaustiveDependencies: open is the trigger; messages/needsKey are read once.
  useEffect(() => {
    if (!open) {
      seededRef.current = false;
      inboxRef.current = false;
      return;
    }
    if (seededRef.current) return;
    if (needsKey) return;
    const last = messages[messages.length - 1];
    if (!last || last.role !== "user") return;
    seededRef.current = true;
    void runStream(messages);
  }, [open]);

  function clear() {
    setMessages([]);
    setError(null);
  }

  function resetKey() {
    clearLearnerKey(config.provider);
    setLearnerKey(null);
    setByokOpen(true);
  }

  return (
    <>
      {/*
        modal={false}: the chat is a co-pilot, not a takeover. Removing
        the overlay + focus trap lets the learner keep scrolling the
        tutorial, clicking code blocks, and editing the playground
        while the assistant is open. ESC still closes via Radix.
      */}
      <Dialog.Root open={open} onOpenChange={onOpenChange} modal={false}>
        <Dialog.Portal>
          <Dialog.Content
            className="chat-panel"
            aria-describedby={undefined}
            onInteractOutside={(e) => e.preventDefault()}
          >
            <header className="chat-head">
              <div className="chat-head-id">
                <Sparkles size={16} className="chat-head-icon" aria-hidden="true" />
                <div>
                  <Dialog.Title className="chat-title">{config.name}</Dialog.Title>
                  {config.tagline && <div className="chat-tagline">{config.tagline}</div>}
                </div>
              </div>
              <div className="chat-head-actions">
                {config.byok !== "disabled" && (
                  <button type="button" title="Reset key" onClick={resetKey}>
                    <Settings size={16} />
                  </button>
                )}
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

            {needsKey ? (
              <div className="chat-setup" role="status">
                <KeyRound size={22} aria-hidden="true" />
                <h3>API key required</h3>
                <p>
                  {config.name} needs an API key to answer questions. Add one to get started — it's
                  stored in this browser only.
                </p>
                <button type="button" onClick={() => setByokOpen(true)}>
                  Set up key
                </button>
              </div>
            ) : (
              <div className="chat-list" ref={listRef}>
                {messages.map((m, i) => (
                  <div key={i} className={`chat-msg chat-msg-${m.role}`}>
                    <span className="chat-role">{m.role === "user" ? "You" : config.name}</span>
                    <div className="chat-content">
                      {m.role === "assistant" ? (
                        // react-markdown sanitizes by default (no raw HTML),
                        // which matters because the assistant output is
                        // untrusted. remark-gfm adds tables + strikethrough.
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                      ) : (
                        m.content
                      )}
                    </div>
                  </div>
                ))}
                {/*
                  Show the thinking indicator while we're streaming AND the
                  last message isn't yet from the assistant (i.e. we haven't
                  received the first chunk that adds an empty assistant
                  message to the array). Once chunks start landing, the
                  message itself updates and the dots disappear.
                */}
                {streaming && messages[messages.length - 1]?.role !== "assistant" && (
                  <div className="chat-msg chat-msg-assistant">
                    <span className="chat-role">{config.name}</span>
                    <div className="chat-content">
                      <span className="chat-thinking" role="status" aria-label="Thinking">
                        <span /> <span /> <span />
                      </span>
                    </div>
                  </div>
                )}
                {error && <div className="chat-error">⚠ {error}</div>}
              </div>
            )}

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
                placeholder={needsKey ? "Add an API key to start chatting" : `Ask ${config.name}…`}
                disabled={streaming || needsKey}
              />
              <button
                type="submit"
                disabled={streaming || needsKey || !input.trim()}
                aria-label="Send"
              >
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
        onKeySaved={() => setLearnerKey(loadLearnerKey(config.provider))}
      />
    </>
  );
}
