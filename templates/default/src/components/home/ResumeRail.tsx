import { useEffect, useState } from "react";
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
  const [mostRecent, setMostRecent] = useState<{
    slug: string;
    title: string;
    step: string;
  } | null>(null);

  useEffect(() => {
    if (!state) return;
    const entries = Object.entries(state.lastVisited);
    if (entries.length === 0) return setMostRecent(null);
    const latest = entries[entries.length - 1];
    if (!latest) return setMostRecent(null);
    const [slug, step] = latest;
    const tutorial = tutorials.find((t) => t.slug === slug);
    if (!tutorial) return setMostRecent(null);
    setMostRecent({ slug, title: tutorial.title, step });
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
