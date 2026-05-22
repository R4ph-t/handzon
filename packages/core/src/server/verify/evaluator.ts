import type { VerifyCheck, VerifySpec } from "../../collections.ts";

/**
 * Observed values the agent reports for one check. The set of valid
 * fields depends on the check `kind` — extras are ignored. Server
 * never trusts pass/fail flags from the agent; it always re-scores
 * the observations against the spec.
 */
export interface CheckObservation {
  /** file_exists / file_contains */
  exists?: boolean;
  /** file_contains */
  body?: string;
  /** shell */
  exitCode?: number;
  stdout?: string;
  /** http */
  status?: number;
  responseBody?: string;
}

export interface VerifyVerdict {
  passed: boolean;
  /** Index into spec.checks of the first failing check (when passed === false). */
  failingCheckIndex?: number;
  /** The author's hint for the failing check, if any. */
  hint?: string;
  /** A short server-side explanation of *why* the check failed. */
  reason?: string;
}

function fail(idx: number, check: VerifyCheck, reason: string): VerifyVerdict {
  return { passed: false, failingCheckIndex: idx, hint: check.hint, reason };
}

/**
 * Score one check's observation against its declared spec. Returns
 * either a pass marker or a structured failure with reason + hint
 * so the calling MCP tool can echo something useful to the agent.
 *
 * Pure of I/O. The agent does the side effects; the server scores.
 */
function evaluateOne(check: VerifyCheck, idx: number, obs: CheckObservation): VerifyVerdict {
  switch (check.kind) {
    case "file_exists": {
      if (obs.exists === true) return { passed: true };
      return fail(
        idx,
        check,
        `Expected ${check.path} to exist but the agent reported it does not.`,
      );
    }
    case "file_contains": {
      if (obs.exists === false) {
        return fail(idx, check, `File ${check.path} does not exist.`);
      }
      const body = obs.body ?? "";
      if (new RegExp(check.pattern).test(body)) return { passed: true };
      return fail(idx, check, `Expected ${check.path} to match /${check.pattern}/.`);
    }
    case "shell": {
      if (typeof check.expect.exitCode === "number") {
        if (obs.exitCode !== check.expect.exitCode) {
          return fail(
            idx,
            check,
            `Expected exit code ${check.expect.exitCode} from \`${check.run}\`, got ${obs.exitCode}.`,
          );
        }
      }
      if (check.expect.stdoutMatches) {
        const stdout = obs.stdout ?? "";
        if (!new RegExp(check.expect.stdoutMatches).test(stdout)) {
          return fail(
            idx,
            check,
            `Expected stdout of \`${check.run}\` to match /${check.expect.stdoutMatches}/.`,
          );
        }
      }
      return { passed: true };
    }
    case "http": {
      if (typeof check.expect.status === "number") {
        if (obs.status !== check.expect.status) {
          return fail(
            idx,
            check,
            `Expected status ${check.expect.status} from ${check.url}, got ${obs.status}.`,
          );
        }
      }
      const body = obs.responseBody ?? "";
      if (check.expect.bodyIncludes && !body.includes(check.expect.bodyIncludes)) {
        return fail(
          idx,
          check,
          `Expected response body of ${check.url} to include "${check.expect.bodyIncludes}".`,
        );
      }
      if (check.expect.bodyMatches && !new RegExp(check.expect.bodyMatches).test(body)) {
        return fail(
          idx,
          check,
          `Expected response body of ${check.url} to match /${check.expect.bodyMatches}/.`,
        );
      }
      return { passed: true };
    }
  }
}

/**
 * Pure-function evaluator: spec + agent-reported observations →
 * pass/fail verdict. Short-circuits on first failure so the
 * failingCheckIndex is the first thing wrong, not the last.
 *
 * `observations` must be the same length as `spec.checks` — one
 * observation per check, in order. The agent is responsible for
 * filling in the right shape per check kind.
 */
export function evaluate(spec: VerifySpec, observations: CheckObservation[]): VerifyVerdict {
  if (observations.length !== spec.checks.length) {
    return {
      passed: false,
      reason: `Expected ${spec.checks.length} observations, got ${observations.length}.`,
    };
  }
  for (let i = 0; i < spec.checks.length; i++) {
    const verdict = evaluateOne(spec.checks[i]!, i, observations[i] ?? {});
    if (!verdict.passed) return verdict;
  }
  return { passed: true };
}
