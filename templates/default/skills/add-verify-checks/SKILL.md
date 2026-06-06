---
name: add-verify-checks
description: Declare a machine-verifiable `verify` spec in a step's frontmatter so an agent running on the learner's machine can prove the step's work and the server can tick the checkpoint automatically.
triggers: ["add verify", "verify checks", "machine verifiable", "submit_verification", "verify spec"]
---

Use this when a step asks the learner to *do* something on their machine and the work can be observed deterministically (a file landed, a command exited 0, a port responds). The agent runs the checks; the server scores them; on pass the matching `<Checkpoint>` ticks automatically. For visual-only outcomes or things only the learner can judge, fall back to the prose `<Checkpoint label="…">` path documented in `add-checkpoint`.

This skill is the sibling of `add-checkpoint`. Read that first if you haven't — gating, the one-checkpoint-per-step rule, and stable ids all apply unchanged. The `verify` block layers deterministic scoring on top.

## 1. Decide whether checks belong

Add `verify` checks when **all three** hold:

- The step is gated (the tutorial's `_meta.json` has `"gated": true`).
- It asks the learner to *do* something concrete: install a dep, run a command, hit a URL, write a file.
- The "did they do it?" question can be answered from the learner's machine without a human eye.

Skip checks (use prose `<Checkpoint>` only) when:

- The outcome is visual or aesthetic ("the welcome screen looks right", "the chart shows the right shape").
- The outcome is environment-specific in a way you can't control (custom port, custom directory layout, behind a VPN, etc.).
- The step is conceptual (read-only). Don't add a checkpoint at all.

If you're not sure, prose-fallback is the safe default. A flaky check is worse than no check: it teaches the learner that the system is broken.

## 2. Pick the right `kind` per outcome

| You want to verify… | Use `kind` | Field shape |
|---|---|---|
| File X was created | `file_exists` | `path: "path/to/file"` |
| Config or content landed in a file | `file_contains` | `path`, `pattern` (regex) |
| Command exited 0 (or matched specific stdout) | `shell` | `run`, `expect.exitCode`, `expect.stdoutMatches` |
| Service responds at a URL | `http` | `url`, `expect.status`, `expect.bodyIncludes` or `expect.bodyMatches` |

**Rules of thumb:**

- Prefer `file_exists` over `shell` for "did they create X?" — it's cheaper and doesn't depend on a working shell.
- Use `shell` when the question is intrinsically "did the command work?" — `pnpm test`, `node -e …`, `cargo check`. Don't shell into package-manager internals (`npm doctor`, `pnpm doctor`) — too brittle.
- Use `http` only for services on `localhost`. Never hit production URLs from a verification check.
- A check can have **either** `expect.exitCode` **or** `expect.stdoutMatches`, or both. If both are set, both must match.

## 3. Write hints that explain failure causes

Every check accepts a `hint`. The hint is shown to the learner inline under the checkpoint when the check fails, **after** the failure reason. It should explain the **most likely cause**, not restate what the check measured.

Good hints:

- `hint: "Did `npm create vite` succeed? Check the directory you ran it in."`
- `hint: "Dev server isn't responding on :5173. Did `npm run dev` start cleanly?"`
- `hint: "React isn't in dependencies. Try `npm install react react-dom`."`

Bad hints (restate the check):

- `hint: "package.json should exist."` — that's what the check already measures.
- `hint: "The shell command failed."` — the learner can see that.
- `hint: "Status was not 200."` — restates the failure, no remediation.

A good hint **points the learner at the next thing to try**.

## 4. Stable `id` matching the Checkpoint

The `verify.id` MUST match a `<Checkpoint id="…">` in the same step's MDX. Build fails loudly otherwise — this is enforced in `handzon-core/src/collections.ts` at content-collection load.

Use the same `<step-area>/<concrete-outcome>` convention as `add-checkpoint`. The two ids are the **same string** — that's the link:

```yaml
---
title: Set up the project
verify:
  id: setup/dev-server-running
  cwd: "$LEARNER_PROJECT"
  checks:
    - kind: file_exists
      path: package.json
      hint: "Did `npm create vite` succeed? Check the directory you ran it in."
    - kind: shell
      run: 'node -e "require(\"./package.json\").dependencies.react"'
      expect: { exitCode: 0 }
      hint: "React isn't in dependencies. Try `npm install react react-dom`."
    - kind: http
      url: "http://localhost:5173"
      expect: { status: 200, bodyIncludes: "<title>Vite + React</title>" }
      hint: "Dev server isn't responding on :5173. Did `npm run dev` start cleanly?"
---
```

```mdx
<Checkpoint id="setup/dev-server-running" label="My dev server is running and the browser shows the Vite welcome screen." />
```

## 5. Use per-track verify maps when tracks differ

If the tutorial declares `tracks`, `verify` can be either a shared spec or a map keyed by track id. Use the map shape when each track needs different files, commands, ports, or test runners.

```yaml
---
title: Run the tests
verify:
  py:
    id: hello/tests-pass
    cwd: "$LEARNER_PROJECT"
    checks:
      - kind: shell
        run: "python -m pytest"
        expect: { exitCode: 0 }
  ts:
    id: hello/tests-pass
    cwd: "$LEARNER_PROJECT"
    checks:
      - kind: shell
        run: "npm test"
        expect: { exitCode: 0 }
---
```

Rules:

- Include every declared track in a per-track map. Missing or unknown track ids fail the build.
- Use the same checkpoint id across tracks when the learning outcome is the same.
- The MCP tools resolve the active track from an explicit `track` argument, then `prefs.track`, then `defaultTrack`, then the first declared track.
- Keep the browser `<Checkpoint>` shared. Progress is track-agnostic.

## 6. Sanity-check the spec yourself

Before publishing, run the checks against your own machine the way an agent would:

1. **Pass case:** complete the step exactly as you wrote it; confirm every check passes. Then submit a clean state to your own MCP and watch the checkpoint tick.
2. **Fail case per check:** intentionally break each check (delete the file, uninstall the dep, kill the dev server) and confirm the **right hint fires** — not a different check's hint, not the wrong reason. The evaluator short-circuits on first failure, so the order of `checks` matters.

If a hint surprises you in the fail case, rewrite it. Hints that read fine in the abstract often fall apart in context.

## 7. Order checks from cheapest to most diagnostic

The evaluator stops at the first failure. Put the cheapest, most-likely-to-fail check first:

1. **File existence** (cheap, catches "didn't run the install command at all").
2. **File contents** (still cheap, catches "ran but in the wrong directory").
3. **Shell command** (medium, catches "installed but broken").
4. **HTTP** (expensive, catches "everything works but the server isn't running").

This way the learner gets the most actionable failure first instead of waiting for a slow `http` check to confirm what `file_exists` would have caught instantly.

## 8. Don't

- **Don't** declare a `verify` block without a matching `<Checkpoint id="…">`. The build fails. (Good — that's the safety net.)
- **Don't** point checks at the *author's* machine. `path: /Users/raph/…` is wrong; `path: package.json` (cwd-relative) is right.
- **Don't** shell into package-manager internals (`npm doctor`, `pnpm store status`) — too noisy, too brittle.
- **Don't** stack multiple `<Checkpoint>` blocks in one step to map to multiple `verify` entries. The framework treats the first toggle as the gate; the rest are decorative. One checkpoint per step still applies.
- **Don't** use `http` checks for non-localhost URLs.
- **Don't** write hints that restate the check. Explain the cause, not the symptom.
- **Don't** rewrite the prose `<Checkpoint label="…">` when adding `verify` — the label is still what the learner reads. The checks are what the agent verifies. Both stay.

## 9. Cross-references

- `add-checkpoint` for the gating mechanic, label voice, and one-checkpoint-per-step rule. Read that first.
- `review-tutorial` flags gated steps that have a `<Checkpoint>` but no `verify.checks` — useful before publishing.
- The evaluator lives in `handzon-core/src/server/verify/evaluator.ts`. If you need to test a spec in isolation, that module is pure and unit-testable.
