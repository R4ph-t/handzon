import { useState } from "react";

type Entry =
  | { command: string; output?: string; prompt?: string }
  | { output: string; prompt?: never; command?: never };

interface Props {
  entries: Entry[];
  title?: string;
  prompt?: string;
}

export default function Terminal({ entries, title = "Terminal", prompt = "$" }: Props) {
  const [revealed, setRevealed] = useState(entries.length);

  const visible = entries.slice(0, revealed);
  return (
    <div className="term">
      <div className="term-bar">
        <span className="term-dots" aria-hidden="true">
          <span /> <span /> <span />
        </span>
        <span className="term-title">{title}</span>
      </div>
      <pre className="term-body">
        {visible.map((entry, i) => (
          <div key={i}>
            {entry.command !== undefined && (
              <div className="term-line">
                <span className="term-prompt">{entry.prompt ?? prompt}</span>
                <span>{entry.command}</span>
              </div>
            )}
            {entry.output !== undefined && entry.output !== "" && (
              <div className="term-out">{entry.output}</div>
            )}
          </div>
        ))}
      </pre>
      {revealed < entries.length && (
        <button type="button" className="term-run" onClick={() => setRevealed((r) => r + 1)}>
          ▶ Next
        </button>
      )}
    </div>
  );
}
