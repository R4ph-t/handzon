import { diffLines } from "diff";
import { useMemo, useState } from "react";

interface Props {
  before: string;
  after: string;
  lang?: string;
  layout?: "side-by-side" | "unified";
  beforeLabel?: string;
  afterLabel?: string;
}

export default function Diff({
  before,
  after,
  layout: initialLayout = "side-by-side",
  beforeLabel = "Before",
  afterLabel = "After",
}: Props) {
  const [layout, setLayout] = useState(initialLayout);
  const parts = useMemo(() => diffLines(before, after), [before, after]);

  if (layout === "unified") {
    return (
      <div className="diff">
        <div className="diff-bar">
          <button type="button" onClick={() => setLayout("side-by-side")}>
            Side-by-side
          </button>
        </div>
        <pre className="diff-body">
          {parts.map((part, i) => (
            <span
              key={i}
              className={part.added ? "diff-add" : part.removed ? "diff-del" : "diff-ctx"}
            >
              {part.added ? "+ " : part.removed ? "- " : "  "}
              {part.value}
            </span>
          ))}
        </pre>
      </div>
    );
  }

  const leftLines: string[] = [];
  const rightLines: string[] = [];
  for (const p of parts) {
    const lines = p.value.split("\n");
    if (lines[lines.length - 1] === "") lines.pop();
    if (p.added) {
      for (const l of lines) {
        leftLines.push("");
        rightLines.push(`+ ${l}`);
      }
    } else if (p.removed) {
      for (const l of lines) {
        leftLines.push(`- ${l}`);
        rightLines.push("");
      }
    } else {
      for (const l of lines) {
        leftLines.push(`  ${l}`);
        rightLines.push(`  ${l}`);
      }
    }
  }

  return (
    <div className="diff">
      <div className="diff-bar">
        <button type="button" onClick={() => setLayout("unified")}>
          Unified
        </button>
      </div>
      <div className="diff-grid">
        <div className="diff-col">
          <div className="diff-label">{beforeLabel}</div>
          <pre>
            {leftLines.map((l, i) => (
              <div key={i} className={l.startsWith("- ") ? "diff-del" : "diff-ctx"}>
                {l || " "}
              </div>
            ))}
          </pre>
        </div>
        <div className="diff-col">
          <div className="diff-label">{afterLabel}</div>
          <pre>
            {rightLines.map((l, i) => (
              <div key={i} className={l.startsWith("+ ") ? "diff-add" : "diff-ctx"}>
                {l || " "}
              </div>
            ))}
          </pre>
        </div>
      </div>
    </div>
  );
}
