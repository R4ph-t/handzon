import { LifeBuoy } from "lucide-react";
import { dispatchAssist, useAiEnabled } from "../../lib/ai/assist";

interface Props {
  /** Free-form topic appended to the seed message ("I'm stuck on …"). */
  topic?: string;
  /** Override the default button label. */
  label?: string;
}

/**
 * Author-placed inline button that opens the in-app tutor pre-seeded
 * with an "unstuck" intent. Renders nothing when `aiConfig.enabled`
 * is false on the host page.
 */
export default function HelpMe({ topic, label }: Props) {
  const enabled = useAiEnabled();
  if (!enabled) return null;
  return (
    <button
      type="button"
      className="hz-helpme"
      onClick={() => dispatchAssist({ kind: "unstuck", topic })}
    >
      <LifeBuoy size={14} aria-hidden="true" />
      <span>{label ?? (topic ? `Stuck on ${topic}?` : "Stuck? Ask the tutor")}</span>
    </button>
  );
}
