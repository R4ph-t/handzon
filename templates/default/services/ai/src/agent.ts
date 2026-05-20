import { Agent } from "@mastra/core/agent";
import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { type ProviderName, pickModel } from "./providers";
import { ASSISTANT_SKILLS } from "./skills";
import { type AssistantPayload, buildTools } from "./tools";

const TONE_RULES: Record<string, string> = {
  socratic:
    "When the learner seems confused, ask a clarifying question before answering. Nudge toward the insight rather than handing it over. If they ask twice, give the answer.",
  direct:
    "Give clear, concise answers with brief explanations. Don't ask back unless you genuinely cannot proceed.",
  encouraging:
    "Use warm, affirming language. Celebrate small wins. Same content rules — never spoil quizzes/checkpoints on the first ask.",
};

interface AgentOptions {
  payload: AssistantPayload;
  config: {
    provider: ProviderName;
    model: string;
    name?: string;
    tone?: "socratic" | "direct" | "encouraging";
    persona?: string;
    customSystemPrompt?: string;
    disabledSkills?: string[];
  };
  learnerKey?: string;
}

export function createAssistant({ payload, config, learnerKey }: AgentOptions): Agent {
  const tone = config.tone ?? "socratic";
  const name = config.name ?? "Helper";
  const enabledSkills = ASSISTANT_SKILLS.filter((s) => !config.disabledSkills?.includes(s.name));

  const baseTools = buildTools(payload);

  const useSkill = createTool({
    id: "useSkill",
    description: `Load the full body of a built-in skill. Available: ${enabledSkills.map((s) => s.name).join(", ")}.`,
    inputSchema: z.object({ name: z.string() }),
    execute: async (input: { name: string }) => {
      const skill = enabledSkills.find((s) => s.name === input.name);
      if (!skill) return { error: `No skill "${input.name}".` };
      return { name: skill.name, body: skill.body };
    },
  });

  const outline = payload.outline
    .map((s) => `${s.current ? "→" : s.completed ? "✓" : " "} ${s.slug}: ${s.title}`)
    .join("\n");

  const skillsHeader = enabledSkills.map((s) => `- ${s.name}: ${s.description}`).join("\n");

  const systemPrompt =
    config.customSystemPrompt ??
    `You are ${name}, a tutorial assistant helping a learner work through "${payload.tutorial.title}".
The learner is on step "${payload.currentStep.title}".

CORE RULES:
- Help them understand THIS step. Avoid leaking content from later steps.
- ${TONE_RULES[tone]}
- For Quiz and Checkpoint content, NEVER reveal the answer unless they ask twice.
- When they paste an error, explain root cause before suggesting a fix.
- Reference specific code blocks, file names, or commands shown in this step.
- Be concise. Use fenced code blocks for code.

${config.persona ? `PERSONA:\n${config.persona}\n` : ""}

TUTORIAL OUTLINE:
${outline}

CURRENT STEP CONTENT:
${payload.currentStep.source}

${payload.priorSteps.length ? `PRIOR STEPS:\n${payload.priorSteps.map((s) => `--- ${s.title} ---\n${s.source}`).join("\n\n")}` : ""}

${payload.references.length ? `REFERENCE DOCS:\n${payload.references.map((r) => `--- ${r.source} ---\n${r.content}`).join("\n\n")}` : ""}

AVAILABLE SKILLS (use the useSkill tool to load any body before applying):
${skillsHeader}
`;

  return new Agent({
    id:
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") || "helper",
    name,
    instructions: systemPrompt,
    model: pickModel(config.provider, config.model, learnerKey),
    tools: { ...baseTools, useSkill },
  });
}
