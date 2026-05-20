import { useMemo } from "react";
import { useProgress } from "~/lib/progress/useProgress";

interface Props {
  tutorialSlug: string;
  totalSteps: number;
}

export default function Progress({ tutorialSlug, totalSteps }: Props) {
  const { state } = useProgress();
  const completed = useMemo(() => {
    return Object.entries(state.steps).filter(
      ([k, v]) => k.startsWith(`${tutorialSlug}/`) && v === "complete",
    ).length;
  }, [state.steps, tutorialSlug]);

  const pct = totalSteps > 0 ? Math.round((completed / totalSteps) * 100) : 0;

  return (
    <div
      className="progress"
      role="progressbar"
      aria-label={`${completed} of ${totalSteps} steps complete`}
      aria-valuenow={completed}
      aria-valuemin={0}
      aria-valuemax={totalSteps}
    >
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="progress-label">
        {completed} / {totalSteps} steps
      </div>
    </div>
  );
}
