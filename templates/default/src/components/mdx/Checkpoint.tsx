import { useEffect, useId } from "react";
import { Check } from "lucide-react";
import { useProgress } from "~/lib/progress/useProgress";

interface Props {
  label: string;
  id?: string;
  /**
   * The current step key, injected by the layout (tutorial slug / step slug).
   * Components that aren't aware of the route still work — they just won't
   * mark step completion.
   */
  tutorial?: string;
  step?: string;
}

export default function Checkpoint({ label, id, tutorial, step }: Props) {
  const reactId = useId();
  const checkpointId = id ?? `checkpoint:${reactId}:${label.slice(0, 40)}`;
  const { state, recordCheckpoint, markStepComplete } = useProgress();
  const done = !!state.checkpoints[checkpointId];

  // When a checkpoint is completed, mark the host step complete so the
  // sidebar and Next button update in sync.
  useEffect(() => {
    if (done && tutorial && step) markStepComplete(tutorial, step);
  }, [done, tutorial, step, markStepComplete]);

  function onToggle() {
    if (done) return;
    recordCheckpoint(checkpointId);
    if (tutorial && step) markStepComplete(tutorial, step);
  }

  return (
    <div className={done ? "checkpoint is-done" : "checkpoint"}>
      <button type="button" onClick={onToggle} aria-pressed={done}>
        <span className="checkpoint-box">{done && <Check size={16} />}</span>
        <span>{label}</span>
      </button>
      {done && <span className="checkpoint-msg">Step complete</span>}
    </div>
  );
}
