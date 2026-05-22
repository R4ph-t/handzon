import { writeProgressEntries } from "../progress.ts";
import { errorResult, type McpTool, text } from "./protocol.ts";

const SCOPE = "progress:write";

function requireLearner(learnerId: string | undefined) {
  if (!learnerId) {
    throw new Error("No resolved learner — bearer token required.");
  }
  return learnerId;
}

/**
 * MCP write tools. Each one builds the same `{ kind, scope, key, value }`
 * row shape the cookie-authed /api/progress endpoint accepts and pipes
 * it through the shared writeProgressEntries() writer. Sources tag the
 * row with `source: "mcp"` so author-side telemetry can distinguish
 * agent-driven completions from in-browser clicks.
 */
export const progressWriteTools: McpTool[] = [
  {
    name: "complete_checkpoint",
    description:
      "Mark a checkpoint complete for the authenticated learner. Optionally include evidence (command, output, files) for telemetry.",
    requiredScope: SCOPE,
    inputSchema: {
      type: "object",
      properties: {
        tutorial: { type: "string", minLength: 1 },
        step: { type: "string", minLength: 1 },
        checkpointId: { type: "string", minLength: 1 },
        evidence: {
          type: "object",
          properties: {
            command: { type: "string" },
            output: { type: "string" },
            files: { type: "object" },
          },
          additionalProperties: true,
        },
      },
      required: ["tutorial", "step", "checkpointId"],
      additionalProperties: false,
    },
    handler: async (args, ctx) => {
      const a = args as {
        tutorial: string;
        step: string;
        checkpointId: string;
        evidence?: Record<string, unknown>;
      };
      const learnerId = requireLearner(ctx.learnerId);
      await writeProgressEntries(learnerId, [
        {
          kind: "checkpoint",
          scope: `${a.tutorial}/${a.step}`,
          key: a.checkpointId,
          value: { source: "mcp", evidence: a.evidence ?? null, ts: Date.now() },
        },
      ]);
      return text(`Checkpoint ${a.checkpointId} marked complete.`);
    },
  },
  {
    name: "uncheck_checkpoint",
    description: "Undo a previously completed checkpoint (tombstone the row).",
    requiredScope: SCOPE,
    inputSchema: {
      type: "object",
      properties: {
        tutorial: { type: "string", minLength: 1 },
        step: { type: "string", minLength: 1 },
        checkpointId: { type: "string", minLength: 1 },
      },
      required: ["tutorial", "step", "checkpointId"],
      additionalProperties: false,
    },
    handler: async (args, ctx) => {
      const a = args as { tutorial: string; step: string; checkpointId: string };
      const learnerId = requireLearner(ctx.learnerId);
      await writeProgressEntries(learnerId, [
        {
          kind: "checkpoint",
          scope: `${a.tutorial}/${a.step}`,
          key: a.checkpointId,
          value: null,
        },
      ]);
      return text(`Checkpoint ${a.checkpointId} unchecked.`);
    },
  },
  {
    name: "complete_step",
    description: "Mark a step complete (mirrors clicking through after a checkpoint).",
    requiredScope: SCOPE,
    inputSchema: {
      type: "object",
      properties: {
        tutorial: { type: "string", minLength: 1 },
        step: { type: "string", minLength: 1 },
      },
      required: ["tutorial", "step"],
      additionalProperties: false,
    },
    handler: async (args, ctx) => {
      const a = args as { tutorial: string; step: string };
      const learnerId = requireLearner(ctx.learnerId);
      await writeProgressEntries(learnerId, [
        {
          kind: "step",
          scope: a.tutorial,
          key: a.step,
          value: "complete",
        },
      ]);
      return text(`Step ${a.step} marked complete.`);
    },
  },
  {
    name: "mark_step_incomplete",
    description: "Undo a step completion.",
    requiredScope: SCOPE,
    inputSchema: {
      type: "object",
      properties: {
        tutorial: { type: "string", minLength: 1 },
        step: { type: "string", minLength: 1 },
      },
      required: ["tutorial", "step"],
      additionalProperties: false,
    },
    handler: async (args, ctx) => {
      const a = args as { tutorial: string; step: string };
      const learnerId = requireLearner(ctx.learnerId);
      await writeProgressEntries(learnerId, [
        {
          kind: "step",
          scope: a.tutorial,
          key: a.step,
          value: null,
        },
      ]);
      return text(`Step ${a.step} marked incomplete.`);
    },
  },
  {
    name: "record_quiz",
    description: "Record a quiz attempt (chosen indices + correct flag).",
    requiredScope: SCOPE,
    inputSchema: {
      type: "object",
      properties: {
        tutorial: { type: "string", minLength: 1 },
        quizId: { type: "string", minLength: 1 },
        chosen: { type: "array", items: { type: "integer" } },
        correct: { type: "boolean" },
      },
      required: ["tutorial", "quizId", "chosen", "correct"],
      additionalProperties: false,
    },
    handler: async (args, ctx) => {
      const a = args as {
        tutorial: string;
        quizId: string;
        chosen: number[];
        correct: boolean;
      };
      const learnerId = requireLearner(ctx.learnerId);
      await writeProgressEntries(learnerId, [
        {
          kind: "quiz",
          scope: a.tutorial,
          key: a.quizId,
          value: { chosen: a.chosen, correct: a.correct, ts: Date.now(), source: "mcp" },
        },
      ]);
      return text(`Quiz ${a.quizId} recorded.`);
    },
  },
  {
    name: "set_last_visited",
    description: "Update the learner's last-visited step for a tutorial.",
    requiredScope: SCOPE,
    inputSchema: {
      type: "object",
      properties: {
        tutorial: { type: "string", minLength: 1 },
        step: { type: "string", minLength: 1 },
      },
      required: ["tutorial", "step"],
      additionalProperties: false,
    },
    handler: async (args, ctx) => {
      const a = args as { tutorial: string; step: string };
      const learnerId = requireLearner(ctx.learnerId);
      await writeProgressEntries(learnerId, [
        {
          kind: "lastVisited",
          scope: a.tutorial,
          key: "step",
          value: { step: a.step, ts: Date.now() },
        },
      ]);
      return text(`Last-visited set to ${a.tutorial}/${a.step}.`);
    },
  },
  {
    name: "set_preference",
    description: "Set a learner preference (free-form key/value).",
    requiredScope: SCOPE,
    inputSchema: {
      type: "object",
      properties: {
        key: { type: "string", minLength: 1 },
        value: {},
      },
      required: ["key", "value"],
      additionalProperties: false,
    },
    handler: async (args, ctx) => {
      const a = args as { key: string; value: unknown };
      const learnerId = requireLearner(ctx.learnerId);
      await writeProgressEntries(learnerId, [
        {
          kind: "pref",
          scope: "global",
          key: a.key,
          value: a.value,
        },
      ]);
      return text(`Preference ${a.key} set.`);
    },
  },
];

/**
 * Catch-all helper for surfacing handler errors as MCP-shaped error
 * results — keeps the tool factories tidy when a wrapped call fails.
 */
export function toolError(message: string) {
  return errorResult(message);
}
