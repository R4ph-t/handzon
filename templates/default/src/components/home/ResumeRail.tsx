import { useMemo } from "react";
import { useProgressAfterMount } from "~/lib/progress/useProgress";

interface Tutorial {
  slug: string;
  title: string;
}

interface Props {
  tutorials: Tutorial[];
}

export default function ResumeRail({ tutorials }: Props) {
  const state = useProgressAfterMount();

  // Pick the tutorial with the highest `ts` rather than relying on
  // Object.entries() ordering (which is insertion order — overwriting an
  // existing key keeps its original position, so "most recent insert"
  // can be very stale).
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
    <aside className="resume-rail">
      <div className="rr-label">Resume where you left off</div>
      <a className="rr-link" href={`/${mostRecent.slug}/${mostRecent.step}`}>
        <span className="rr-title">{mostRecent.title}</span>
        <span className="rr-step">→ {mostRecent.step}</span>
      </a>
    </aside>
  );
}
