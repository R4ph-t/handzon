import type { ChatMessage } from "./client";
import type { AssistantContext } from "./context";

export type AssistantIntent =
  | { kind: "unstuck"; topic?: string }
  | {
      kind: "quizFix";
      question: string;
      chosen: string[];
      correct: string[];
    }
  | { kind: "checkpoint"; label: string }
  | { kind: "selection"; text: string }
  | { kind: "playgroundFix"; files: Record<string, string> }
  | { kind: "explainStep" }
  | { kind: "recap" };

export interface AssistantPrompt {
  /** Ready-to-render Markdown a learner can paste anywhere. */
  markdown: string;
  /** Seed messages for ChatPanel — first user turn, no assistant turn. */
  seedMessages: ChatMessage[];
  /** URL-encoded prompt for each external agent. */
  deepLinks: {
    cursor: string;
    claude: string;
    chatgpt: string;
    vscode: string;
  };
}

function header(ctx: AssistantContext): string {
  return [`Tutorial: ${ctx.tutorial.title}`, `Step: ${ctx.currentStep.title}`].join("\n");
}

function renderIntent(intent: AssistantIntent): string {
  switch (intent.kind) {
    case "unstuck":
      return intent.topic
        ? `I'm stuck on "${intent.topic}". Help me figure out what to do next without giving the whole answer.`
        : `I'm stuck on this step. Help me figure out what to do next without giving the whole answer.`;
    case "quizFix":
      return [
        `I got a quiz question wrong and want to understand why.`,
        ``,
        `Question: ${intent.question}`,
        `I chose: ${intent.chosen.join(", ") || "(nothing)"}`,
        `Correct answer: ${intent.correct.join(", ")}`,
        ``,
        `Explain why my choice is wrong without restating the correct answer verbatim — help me see what concept I'm missing.`,
      ].join("\n");
    case "checkpoint":
      return `I'm not sure how to complete this checkpoint: "${intent.label}". Walk me through what to try next.`;
    case "selection":
      return [
        `I have a question about this part of the tutorial:`,
        ``,
        "```",
        intent.text,
        "```",
        ``,
        `Can you explain it in context of where I am?`,
      ].join("\n");
    case "playgroundFix": {
      const files = Object.entries(intent.files)
        .map(([path, body]) => `### \`${path}\`\n\n\`\`\`\n${body}\n\`\`\``)
        .join("\n\n");
      return [
        `My playground code isn't working as expected. Here are the current files:`,
        ``,
        files,
        ``,
        `What's wrong, and what should I change? Point me at the bug; don't just rewrite the file.`,
      ].join("\n");
    }
    case "explainStep":
      return `Walk me through what this step is asking me to do and why it matters.`;
    case "recap":
      return `Give me a one-paragraph recap of what I've learned so far in this tutorial.`;
  }
}

function buildMarkdown(ctx: AssistantContext, intent: AssistantIntent): string {
  return [header(ctx), "", renderIntent(intent)].join("\n");
}

/**
 * Cursor's anysphere deep link expects a `text` query param.
 * Claude.ai and ChatGPT use `?q=...`. VS Code can launch a chat
 * extension via the `vscode://` scheme; we use the generic
 * `vscode://GitHub.copilot-chat/chat?prompt=...` form, which is
 * the closest thing to a stable contract today.
 */
function buildDeepLinks(prompt: string): AssistantPrompt["deepLinks"] {
  const enc = encodeURIComponent(prompt);
  return {
    cursor: `cursor://anysphere.cursor-deeplink/prompt?text=${enc}`,
    claude: `https://claude.ai/new?q=${enc}`,
    chatgpt: `https://chat.openai.com/?q=${enc}`,
    vscode: `vscode://GitHub.copilot-chat/chat?prompt=${enc}`,
  };
}

/**
 * Render an assistant context + a small intent payload into the three
 * surfaces every touchpoint needs: chat seed messages, copyable
 * markdown, and per-agent deep links. Each Family A/B touchpoint is a
 * one-liner around this function.
 */
export function buildAssistantPrompt(
  context: AssistantContext,
  intent: AssistantIntent,
): AssistantPrompt {
  const markdown = buildMarkdown(context, intent);
  return {
    markdown,
    seedMessages: [{ role: "user", content: markdown }],
    deepLinks: buildDeepLinks(markdown),
  };
}
