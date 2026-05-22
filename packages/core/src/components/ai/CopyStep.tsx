import { Check, ClipboardCopy } from "lucide-react";
import { useState } from "react";
import { readStepData } from "../../lib/ai/stepData";

/**
 * Family B touchpoint: copies the current step (title + tutorial
 * title + raw MDX source) to the clipboard so the learner can
 * paste into any tool. Always available — no aiConfig.enabled gate.
 *
 * Rendered alongside <OpenInAgent /> in the per-step footer row.
 */
export default function CopyStep() {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const data = readStepData();
    if (!data) return;
    const body = [
      `# ${data.stepTitle}`,
      ``,
      `From: ${data.tutorialTitle}`,
      ``,
      data.stepSource,
    ].join("\n");
    try {
      await navigator.clipboard.writeText(body);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard not available — fail silently */
    }
  }

  return (
    <button type="button" className="hz-assist-link" onClick={() => void copy()} aria-live="polite">
      {copied ? (
        <Check size={14} aria-hidden="true" />
      ) : (
        <ClipboardCopy size={14} aria-hidden="true" />
      )}
      <span>{copied ? "Copied" : "Copy step"}</span>
    </button>
  );
}
