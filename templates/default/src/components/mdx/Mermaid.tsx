import { useEffect, useRef, useState } from "react";

interface Props {
  chart: string;
  id?: string;
}

/**
 * Interactive mermaid island. The default authoring path is fenced
 * ```mermaid blocks, which rehype-mermaid renders at build time. Use
 * this island only when the diagram needs to respond to runtime state.
 */
export default function Mermaid({ chart, id }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({ startOnLoad: false, theme: "dark", securityLevel: "strict" });
        const { svg } = await mermaid.render(id ?? `mermaid-${Math.random().toString(36).slice(2)}`, chart);
        if (!cancelled && ref.current) ref.current.innerHTML = svg;
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [chart, id]);

  if (error) {
    return (
      <pre className="mermaid-error">
        Mermaid render failed: {error}
        {"\n"}
        {chart}
      </pre>
    );
  }
  return <div ref={ref} className="mermaid-wrap" />;
}
