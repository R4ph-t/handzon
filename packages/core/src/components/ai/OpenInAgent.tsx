import { useEffect, useState } from "react";
import { buildAssistantPrompt } from "../../lib/ai/prompts";
import { contextFromStepData, readStepData, type StepData } from "../../lib/ai/stepData";
import CopyStep from "./CopyStep";

interface Props {
  /** Hide a specific agent from the row. All four shown by default. */
  hide?: Array<"cursor" | "claude" | "chatgpt" | "vscode">;
}

const AGENTS: Array<{
  key: "cursor" | "claude" | "chatgpt" | "vscode";
  label: string;
}> = [
  { key: "cursor", label: "Cursor" },
  { key: "claude", label: "Claude" },
  { key: "chatgpt", label: "ChatGPT" },
  { key: "vscode", label: "VS Code" },
];

/**
 * Family B touchpoint: per-step row of "Open in <agent>" links that
 * fire the explainStep prompt at Cursor / Claude / ChatGPT / VS
 * Code via each tool's deep-link scheme. Always renders — no
 * aiConfig.enabled gate — because the affordance is for learners
 * who bring their own agent.
 */
export default function OpenInAgent({ hide = [] }: Props) {
  const [data, setData] = useState<StepData | null>(null);
  useEffect(() => {
    setData(readStepData());
  }, []);
  if (!data) return null;

  const { deepLinks } = buildAssistantPrompt(contextFromStepData(data), { kind: "explainStep" });
  const visible = AGENTS.filter((a) => !hide.includes(a.key));

  return (
    <div className="hz-openin">
      <span className="hz-openin-label">Explain this step in</span>
      {visible.map((agent) => (
        <a
          key={agent.key}
          className="hz-assist-link"
          href={deepLinks[agent.key]}
          target="_blank"
          rel="noopener noreferrer"
        >
          {agent.label}
        </a>
      ))}
      <CopyStep />
    </div>
  );
}
