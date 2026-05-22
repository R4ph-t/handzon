import { getStep } from "../../lib/content.ts";
import { getDb } from "../db/client.ts";
import { helpRequests } from "../db/schema.ts";
import { writeProgressEntries } from "../progress.ts";
import { type CheckObservation, evaluate } from "../verify/evaluator.ts";
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
      // Checkpoint rows use scope "global" to match the in-browser
      // client (state.checkpoints is keyed by checkpoint id, not
      // by step). Tutorial + step are part of the value payload
      // for telemetry and for the SSE handler that wants to know
      // which step the ack belongs to.
      await writeProgressEntries(learnerId, [
        {
          kind: "checkpoint",
          scope: "global",
          key: a.checkpointId,
          value: {
            source: "mcp",
            tutorial: a.tutorial,
            step: a.step,
            evidence: a.evidence ?? null,
            ts: Date.now(),
          },
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
      // Uncheck also drops the matching kind:"verification" telemetry
      // row so a re-attempt isn't pre-poisoned by the previous
      // failure feedback.
      await writeProgressEntries(learnerId, [
        { kind: "checkpoint", scope: "global", key: a.checkpointId, value: null },
        {
          kind: "verification",
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
    name: "request_help",
    description:
      "Post a help request from the agent into the in-browser tutor's inbox. The next time the learner opens ChatPanel, your query is prepended as a user turn.",
    requiredScope: SCOPE,
    inputSchema: {
      type: "object",
      properties: {
        tutorial: { type: "string", minLength: 1 },
        step: { type: "string", minLength: 1 },
        query: { type: "string", minLength: 1 },
      },
      required: ["tutorial", "step", "query"],
      additionalProperties: false,
    },
    handler: async (args, ctx) => {
      const a = args as { tutorial: string; step: string; query: string };
      const learnerId = requireLearner(ctx.learnerId);
      const db = getDb();
      const [row] = await db
        .insert(helpRequests)
        .values({
          learnerId,
          tutorialSlug: a.tutorial,
          stepSlug: a.step,
          query: a.query,
        })
        .returning({ id: helpRequests.id });
      return text(
        `Help request queued (${row!.id}). It will appear in the learner's tutor on next open.`,
      );
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

/**
 * Family D verification: agent reports observations, server scores.
 * On pass, the same writeProgressEntries() path that
 * complete_checkpoint uses fires + a kind:"verification" telemetry
 * row lands. On fail, only the telemetry row lands and the verdict
 * is returned to the agent. SSE fans the telemetry row to the open
 * browser tab so <Checkpoint> can render an inline failure hint.
 */
export const verificationTools: McpTool[] = [
  {
    name: "submit_verification",
    description:
      "Submit observed values for the current step's verify checks. The server scores against the declared spec and (on pass) marks the matching checkpoint complete. On fail, returns the failing check + hint and does not write a checkpoint row.",
    requiredScope: SCOPE,
    inputSchema: {
      type: "object",
      properties: {
        tutorial: { type: "string", minLength: 1 },
        step: { type: "string", minLength: 1 },
        observations: {
          type: "array",
          description:
            "One observation per declared check, in order. Fields per kind: file_exists {exists}, file_contains {exists, body}, shell {exitCode, stdout}, http {status, responseBody}.",
          items: { type: "object" },
        },
      },
      required: ["tutorial", "step", "observations"],
      additionalProperties: false,
    },
    handler: async (args, ctx) => {
      const a = args as {
        tutorial: string;
        step: string;
        observations: CheckObservation[];
      };
      const learnerId = requireLearner(ctx.learnerId);
      const stepEntry = await getStep(a.tutorial, a.step);
      if (!stepEntry) {
        return errorResult(`No step "${a.step}" in "${a.tutorial}".`);
      }
      const spec = (stepEntry.data as { verify?: unknown }).verify as
        | import("../../collections.ts").VerifySpec
        | undefined;
      if (!spec) {
        return errorResult(
          `Step ${a.tutorial}/${a.step} has no verify block. Use complete_checkpoint for prose-fallback verification.`,
        );
      }

      const verdict = evaluate(spec, a.observations);
      const scope = `${a.tutorial}/${a.step}`;
      const ts = Date.now();

      if (verdict.passed) {
        await writeProgressEntries(learnerId, [
          {
            kind: "checkpoint",
            scope: "global",
            key: spec.id,
            value: {
              source: "verify",
              tutorial: a.tutorial,
              step: a.step,
              results: a.observations,
              ts,
            },
          },
          {
            kind: "verification",
            scope,
            key: spec.id,
            value: { pass: true, ts },
          },
        ]);
        return text(
          JSON.stringify(
            { passed: true, checkpointId: spec.id, message: "All checks passed." },
            null,
            2,
          ),
        );
      }

      await writeProgressEntries(learnerId, [
        {
          kind: "verification",
          scope,
          key: spec.id,
          value: {
            pass: false,
            failingCheckIndex: verdict.failingCheckIndex,
            reason: verdict.reason,
            hint: verdict.hint,
            ts,
          },
        },
      ]);
      return text(
        JSON.stringify(
          {
            passed: false,
            failingCheckIndex: verdict.failingCheckIndex,
            reason: verdict.reason,
            hint: verdict.hint,
          },
          null,
          2,
        ),
      );
    },
  },
];
