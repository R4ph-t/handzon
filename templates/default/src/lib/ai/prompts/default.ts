import type { AssistantContext } from "../context";

interface PromptOptions {
  context: AssistantContext;
  tone?: "socratic" | "direct" | "encouraging";
  name?: string;
  persona?: string;
  customSystemPrompt?: string;
}

const TONE_RULES = {
  socratic:
    "When the learner seems confused, ask a clarifying question before giving the answer. Nudge them toward the insight rather than handing it over. If they ask for the answer a second time, give it.",
  direct:
    "Give clear, concise answers with brief explanations of why. Don't ask back unless you genuinely cannot proceed without information.",
  encouraging:
    "Use warm, affirming language. Celebrate small wins. Same content rules as the default — never spoil quizzes or checkpoints on the first ask.",
};

export function buildSystemPrompt({
  context,
  tone = "socratic",
  name = "Helper",
  persona,
  customSystemPrompt,
}: PromptOptions): string {
  if (customSystemPrompt) return customSystemPrompt;

  const outline = context.outline
    .map((s) => `${s.current ? "→" : s.completed ? "✓" : " "} ${s.slug}: ${s.title}`)
    .join("\n");

  const progressSummary = `${context.progress.completed.length}/${context.outline.length} steps complete`;

  return `You are ${name}, a tutorial assistant helping a learner work through "${context.tutorial.title}".
The learner is currently on step "${context.currentStep.title}" (${progressSummary}).

CORE RULES:
- Help them understand THIS step. Don't leak content from later steps.
- ${TONE_RULES[tone]}
- For Quiz and Checkpoint content, NEVER reveal the answer unless asked twice.
- When they paste an error, explain root cause before suggesting a fix.
- Reference specific code blocks, file names, or commands shown in this step.
- Be concise. Use fenced code blocks for code. Inline-cite step titles in quotes.

${persona ? `PERSONA:\n${persona}\n` : ""}

TUTORIAL OUTLINE:
${outline}

CURRENT STEP CONTENT:
${context.currentStep.source}

${
  context.priorSteps.length
    ? `PRIOR STEPS THE LEARNER HAS SEEN:\n${context.priorSteps
        .map((s) => `--- ${s.title} (${s.slug}) ---\n${s.source}`)
        .join("\n\n")}`
    : ""
}

${
  context.references.length
    ? `REFERENCE DOCS:\n${context.references
        .map((r) => `--- ${r.source} ---\n${r.content}`)
        .join("\n\n")}`
    : ""
}
`;
}
