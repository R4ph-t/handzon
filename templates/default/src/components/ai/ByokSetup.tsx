import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useState } from "react";
import { saveLearnerKey } from "~/lib/ai/client";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  provider: string;
  assistantName: string;
  onKeySaved?: () => void;
}

const PROVIDER_INFO: Record<string, { label: string; href: string }> = {
  anthropic: { label: "Anthropic (Claude)", href: "https://console.anthropic.com/settings/keys" },
  openai: { label: "OpenAI", href: "https://platform.openai.com/api-keys" },
  google: { label: "Google AI Studio", href: "https://aistudio.google.com/app/apikey" },
  "openai-compatible": { label: "OpenAI-compatible", href: "" },
};

export default function ByokSetup({
  open,
  onOpenChange,
  provider,
  assistantName,
  onKeySaved,
}: Props) {
  const [key, setKey] = useState("");
  const info = PROVIDER_INFO[provider] ?? { label: provider, href: "" };

  function save() {
    if (!key.trim()) return;
    saveLearnerKey(provider, key.trim());
    setKey("");
    onOpenChange(false);
    onKeySaved?.();
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="ms-overlay" />
        <Dialog.Content className="byok-panel">
          <Dialog.Close asChild>
            <button type="button" className="ms-close" aria-label="Close">
              <X size={18} />
            </button>
          </Dialog.Close>
          <Dialog.Title>Set up {assistantName}</Dialog.Title>
          <Dialog.Description className="byok-desc">
            {assistantName} needs an API key to answer questions. Your key is stored only in this
            browser.
          </Dialog.Description>

          {info.href && (
            <p className="byok-link">
              Get a {info.label} key →{" "}
              <a href={info.href} target="_blank" rel="noopener noreferrer">
                {info.href.replace(/^https?:\/\//, "")}
              </a>
            </p>
          )}

          <label className="byok-field">
            <span>API key</span>
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="sk-..."
            />
          </label>

          <div className="byok-actions">
            <button type="button" onClick={save} disabled={!key.trim()}>
              Save key
            </button>
          </div>

          <p className="byok-disclaimer">
            Your key never leaves your browser. Calls go from this page directly to the assistant
            service.
          </p>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
