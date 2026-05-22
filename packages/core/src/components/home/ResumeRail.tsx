import { useMemo } from "react";
import { useProgressAfterMount } from "../../lib/progress/useProgress";

interface Tutorial {
  slug: string;
  title: string;
}

interface Props {
  tutorials: Tutorial[];
}

/**
 * "Continue [Tutorial] / step  →" — a single bordered link that reads
 * as one coherent action, replacing the previous three-color, three-
 * size stack of label + title + step.
 */
export default function ResumeRail({ tutorials }: Props) {
  const state = useProgressAfterMount();

  const mostRecent = useMemo(() => {
    if (!state) return null;
    let best: { slug: string; step: string; ts: number } | null = null;
    for (const [slug, entry] of Object.entries(state.lastVisited)) {
      // Legacy shape (older builds stored `step` as a bare string)
      // shows up as `unknown` at runtime — coerce so we don't crash.
      const raw = entry as unknown;
      const next =
        typeof raw === "string"
          ? { step: raw, ts: 0 }
          : { step: (raw as { step: string }).step, ts: (raw as { ts?: number }).ts ?? 0 };
      if (!best || next.ts > best.ts) best = { slug, ...next };
    }
    if (!best) return null;
    const tutorial = tutorials.find((t) => t.slug === best.slug);
    if (!tutorial) return null;
    return { slug: best.slug, title: tutorial.title, step: best.step };
  }, [state, tutorials]);

  if (!state || !mostRecent) return null;

  return (
    <a className="resume-rail" href={`/${mostRecent.slug}/${mostRecent.step}`}>
      <span className="rr-prefix">Continue</span>
      <span className="rr-title">{mostRecent.title}</span>
      <span className="rr-step">/ {mostRecent.step}</span>
      <span className="rr-arrow" aria-hidden="true">
        →
      </span>
    </a>
  );
}
