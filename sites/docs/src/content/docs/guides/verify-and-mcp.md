---
title: Verify Specs and MCP
description: Let local agents start tutorials, run checks, and mark progress through the Handzon MCP endpoint.
---

Handzon exposes tutorials to agents through MCP. Agents can read tutorial content, start local workspaces, run verification checks, and write progress back to the site.

## Starter metadata

`starter` tells an agent how to create or open the learner workspace.

```json
{
  "starter": {
    "kind": "git",
    "repo": "https://github.com/render-examples/flask-hello-world.git",
    "targetDir": "hello-python",
    "setupCommands": [
      "python -m venv .venv",
      ". .venv/bin/activate && pip install -r requirements.txt pytest"
    ],
    "devCommand": ". .venv/bin/activate && flask run"
  }
}
```

Starter kinds:

- `git`: clone an existing repository.
- `command`: run a local scaffold command.

For track-specific tutorials, `starter` can be keyed by track id. Agents use the learner's active track.

## Verify specs

Attach `verify` to step frontmatter when an agent can prove the learner's work:

```yaml
verify:
  id: app/tests-pass
  cwd: "$LEARNER_PROJECT"
  checks:
    - kind: file_exists
      path: package.json
      hint: "Open the starter project root."
    - kind: shell
      run: npm test
      expect:
        exitCode: 0
      hint: "Install dependencies, then run the tests again."
```

The `id` must match a checkpoint in the step body:

```mdx
<Checkpoint id="app/tests-pass" label="The app tests pass." />
```

## Check kinds

`file_exists`
: Passes when the file exists relative to `cwd`.

`file_contains`
: Passes when the file contains a pattern.

`shell`
: Runs a shell command and compares the exit code or output.

`http`
: Checks an HTTP endpoint.

Prefer the smallest check that proves the learner did the work. Avoid checks that depend on secrets or unstable external state.

## MCP endpoint

Every generated site exposes MCP at:

```text
/api/mcp
```

The setup page lives at:

```text
/settings/tokens
```

Learners sign in with GitHub, create a scoped token, and copy an editor-specific install command or config block.

## Read tools

Agents can inspect tutorial content with read tools:

- `list_tutorials`
- `get_tutorial`
- `start_tutorial`
- `get_step`
- `get_progress`

## Write tools

Agents need `progress:write` to update learner state:

- `complete_checkpoint`
- `uncheck_checkpoint`
- `complete_step`
- `mark_step_incomplete`
- `record_quiz`
- `set_last_visited`
- `set_preference`
- `request_help`
- `submit_verification`

Use `progress:read` for read-only agents. Add `progress:write` only when the agent should mark progress or submit verification results.
