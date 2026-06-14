import { Check } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { dispatchAssist, useAiEnabled } from "../../lib/ai/assist";
import { useProgress } from "../../lib/progress/useProgress";

/**
 * Time an unchecked checkpoint must be on-screen before we surface
 * the "Stuck?" nudge. Long enough that learners actively working
 * won't see it, short enough that genuinely stuck learners do.
 */
const STUCK_DELAY_MS = 45_000;

interface Props {
  label: string;
  id?: string;
}

export default function Checkpoint({ label, id }: Props) {
  const reactId = useId();
  const checkpointId = id ?? `checkpoint:${reactId}:${label.slice(0, 40)}`;
  const { state, recordCheckpoint, removeCheckpoint } = useProgress();
  const done = !!state.checkpoints[checkpointId];
  const aiEnabled = useAiEnabled();
  const [stuck, setStuck] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.dispatchEvent(new CustomEvent("hz:step-item"));
  }, []);

  // Show the "Stuck?" nudge after STUCK_DELAY_MS of an unchecked
  // checkpoint being on-screen. Resets the timer if the checkpoint
  // scrolls back off screen. Fires once — once shown, stays shown
  // until the learner ticks the checkpoint.
  useEffect(() => {
    if (done || !aiEnabled || stuck) return;
    const el = rootRef.current;
    if (!el) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            if (timer === null) timer = setTimeout(() => setStuck(true), STUCK_DELAY_MS);
          } else if (timer !== null) {
            clearTimeout(timer);
            timer = null;
          }
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      if (timer !== null) clearTimeout(timer);
    };
  }, [done, aiEnabled, stuck]);

  function onToggle() {
    if (done) {
      removeCheckpoint(checkpointId);
      return;
    }
    recordCheckpoint(checkpointId);
  }

  // Family D: inline failure feedback from a submit_verification call.
  // SSE pushes the verification row into state.verificationFeedback;
  // we render it under the checkpoint label when present and the
  // checkpoint isn't ticked yet. Cleared on the next pass or when
  // the learner unchecks the checkpoint.
  const feedback = state.verificationFeedback[checkpointId];
  const showFeedback = !done && feedback && !feedback.pass;

  return (
    <div
      ref={rootRef}
      className={done ? "checkpoint is-done" : "checkpoint"}
      data-checkpoint-id={checkpointId}
    >
      <button type="button" onClick={onToggle} aria-pressed={done}>
        <span className="checkpoint-box">{done && <Check size={16} />}</span>
        <span>{label}</span>
      </button>
      {done && <span className="checkpoint-msg">Step complete</span>}
      {stuck && !done && (
        <button
          type="button"
          className="checkpoint-nudge"
          onClick={() => dispatchAssist({ kind: "checkpoint", label })}
        >
          Stuck? Ask the tutor →
        </button>
      )}
      {showFeedback && (
        <div className="checkpoint-feedback" role="status">
          <strong>Check failed</strong>
          {feedback.reason && <p>{feedback.reason}</p>}
          {feedback.hint && <p className="checkpoint-feedback-hint">{feedback.hint}</p>}
        </div>
      )}
    </div>
  );
}
