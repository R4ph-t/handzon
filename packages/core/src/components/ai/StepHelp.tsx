import { LifeBuoy } from "lucide-react";
import { dispatchAssist, useAiEnabled } from "../../lib/ai/assist";

interface Props {
  /** Step title used as the "unstuck" topic seed. */
  stepTitle: string;
}

/**
 * Auto-injected step footer rendered by TutorialStep when
 * `aiConfig.autoStepHelp` is true. A learner who scrolls to the end
 * of an unchecked step without making progress hits this affordance
 * before the next-step nav.
 */
export default function StepHelp({ stepTitle }: Props) {
  const enabled = useAiEnabled();
  if (!enabled) return null;
  return (
    <aside className="hz-step-help" role="note">
      <LifeBuoy size={16} aria-hidden="true" />
      <span className="hz-step-help-text">Stuck on this step?</span>
      <button
        type="button"
        className="hz-helpme"
        onClick={() => dispatchAssist({ kind: "unstuck", topic: stepTitle })}
      >
        Ask the tutor
      </button>
    </aside>
  );
}
