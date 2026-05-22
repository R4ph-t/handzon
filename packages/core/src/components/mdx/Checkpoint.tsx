import { Check } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { useProgress } from "../../lib/progress/useProgress";

interface Props {
  label: string;
  id?: string;
}

/**
 * Reads the host tutorial/step from the page-level route marker
 * (<div id="tt-route" data-tutorial-slug=... data-step-slug=...>) that
 * TutorialLayout emits. Looking it up here keeps the Astro wrapper trivial.
 */
function useRoute() {
  const [route, setRoute] = useState<{ tutorial: string; step: string } | null>(null);
  useEffect(() => {
    const el = document.getElementById("tt-route");
    if (!el) return;
    const tutorial = el.dataset.tutorialSlug;
    const step = el.dataset.stepSlug;
    if (tutorial && step) setRoute({ tutorial, step });
  }, []);
  return route;
}

export default function Checkpoint({ label, id }: Props) {
  const reactId = useId();
  const checkpointId = id ?? `checkpoint:${reactId}:${label.slice(0, 40)}`;
  const { state, recordCheckpoint, removeCheckpoint, markStepComplete, markStepIncomplete } =
    useProgress();
  const route = useRoute();
  const done = !!state.checkpoints[checkpointId];

  function onToggle() {
    if (done) {
      removeCheckpoint(checkpointId);
      if (route) markStepIncomplete(route.tutorial, route.step);
      return;
    }
    recordCheckpoint(checkpointId);
    if (route) markStepComplete(route.tutorial, route.step);
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
