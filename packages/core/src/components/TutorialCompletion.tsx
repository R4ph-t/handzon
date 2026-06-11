import { withBase } from "../lib/base";
import { useProgress } from "../lib/progress/useProgress";
import type { TutorialSummary } from "../lib/tutorialSummary";

interface Props {
  tutorialSlug: string;
  totalSteps: number;
  nextTutorial?: TutorialSummary;
}

function countCompletedSteps(steps: Record<string, unknown>, tutorialSlug: string): number {
  return Object.entries(steps).filter(
    ([key, value]) => key.startsWith(`${tutorialSlug}/`) && value === "complete",
  ).length;
}

export default function TutorialCompletion({ tutorialSlug, totalSteps, nextTutorial }: Props) {
  const { state } = useProgress();
  const completedSteps = countCompletedSteps(state.steps, tutorialSlug);
  const isComplete = totalSteps > 0 && completedSteps >= totalSteps;
  const progressLabel = `${Math.min(completedSteps, totalSteps)} / ${totalSteps} steps complete`;

  if (!isComplete) {
    return (
      <section className="tutorial-completion is-locked" aria-label="Tutorial completion">
        <div className="completion-status" aria-disabled="true">
          <span className="completion-kicker">Almost done</span>
          <h2>Complete the remaining checkpoints to finish.</h2>
          <p>
            {progressLabel}
            {nextTutorial ? ` Then you can continue to ${nextTutorial.title}.` : ""}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="tutorial-completion is-complete" aria-label="Tutorial completion">
      <div className="completion-status">
        <span className="completion-kicker">Tutorial complete</span>
        <h2>You completed every step.</h2>
        <p>{progressLabel}</p>
      </div>
      <div className="completion-actions">
        {nextTutorial ? (
          <a
            className="completion-card completion-card-primary"
            href={withBase(`/${nextTutorial.slug}`)}
          >
            <span className="completion-card-label">Continue learning</span>
            <strong>{nextTutorial.title}</strong>
            <span>{nextTutorial.description}</span>
            <span className="completion-meta">
              {nextTutorial.difficulty}
              {nextTutorial.duration ? ` | ${nextTutorial.duration}` : ""}
            </span>
          </a>
        ) : (
          <a className="completion-card completion-card-primary" href={withBase("/")}>
            <span className="completion-card-label">Browse tutorials</span>
            <strong>Pick your next tutorial</strong>
            <span>Browse the catalog and choose what to build next.</span>
          </a>
        )}
      </div>
    </section>
  );
}
