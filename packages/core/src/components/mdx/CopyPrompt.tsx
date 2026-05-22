import { Check, ClipboardCopy } from "lucide-react";
import { useState } from "react";
import { readStepData, renderTemplate } from "../../lib/ai/stepData";

interface Props {
  /**
   * Templated prompt body. Supports `{{tutorialTitle}}`,
   * `{{tutorialSlug}}`, `{{stepTitle}}`, `{{stepSlug}}`, and
   * `{{stepSource}}` placeholders. Unknown placeholders are left
   * untouched so typos surface.
   */
  template: string;
  /** Override the default button label. */
  label?: string;
}

/**
 * Family B touchpoint: author-placed "Copy prompt" button that
 * always works (no aiConfig required). Substitutes step + tutorial
 * data into the template at click time so it stays in sync if the
 * author edits the step.
 */
export default function CopyPrompt({ template, label }: Props) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function copy() {
    setError(null);
    const data = readStepData();
    const body = data ? renderTemplate(template, data) : template;
    try {
      await navigator.clipboard.writeText(body);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <button
      type="button"
      className="hz-copy-prompt"
      onClick={() => void copy()}
      aria-live="polite"
      title={error ?? undefined}
    >
      {copied ? (
        <Check size={14} aria-hidden="true" />
      ) : (
        <ClipboardCopy size={14} aria-hidden="true" />
      )}
      <span>{copied ? "Copied" : (label ?? "Copy prompt")}</span>
    </button>
  );
}
