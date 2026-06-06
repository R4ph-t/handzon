---
name: wire-tutorial-starter
description: Add starter metadata so MCP-aware agents can start a tutorial from a blank workspace by cloning a repo or running an init command locally.
triggers: ["tutorial starter", "starter repo", "blank workspace", "start tutorial", "clone starter", "init tutorial", "mcp start"]
---

Use this when a tutorial expects the learner to begin in an editor or agent with an empty workspace. The Handzon MCP server does not run shell commands on the learner's machine. It returns a bootstrap plan, and the local agent runs the commands.

## 1. Decide the start type

Pick exactly one:

- **`git`** - the learner starts from a repo you control.
- **`command`** - the learner starts from a create-app command like `pnpm create vite`.

Use `git` when the tutorial depends on prepared files, branches, fixtures, or a known broken state. Use `command` when the first step already teaches the scaffold command.

## 2. Add `_meta.json.starter`

If the tutorial declares `tracks`, `starter` can be a map keyed by track id. Use this when each track starts from a different repo or scaffold command.

```json
{
  "tracks": [
    { "id": "py", "label": "Python" },
    { "id": "ts", "label": "TypeScript" }
  ],
  "defaultTrack": "py",
  "starter": {
    "py": {
      "kind": "git",
      "repo": "https://github.com/example/python-starter.git",
      "targetDir": "hello-python",
      "setupCommands": ["python -m venv .venv", ". .venv/bin/activate && pip install -r requirements.txt"],
      "devCommand": ". .venv/bin/activate && flask run"
    },
    "ts": {
      "kind": "git",
      "repo": "https://github.com/example/typescript-starter.git",
      "targetDir": "hello-typescript",
      "setupCommands": ["npm install"],
      "devCommand": "npm start"
    }
  }
}
```

Per-track maps are strict: include every declared track and do not include undeclared keys. Use a single `starter` object only when all tracks share the same bootstrap.

For a repo starter:

```json
{
  "starter": {
    "kind": "git",
    "repo": "https://github.com/example/tutorial-starter.git",
    "ref": "main",
    "targetDir": "my-app",
    "subdir": "app",
    "setupCommands": ["pnpm install"],
    "devCommand": "pnpm dev",
    "notes": ["Use Node 22 or newer."]
  }
}
```

For an init-command starter:

```json
{
  "starter": {
    "kind": "command",
    "initCommand": "pnpm create vite todo --template react-ts",
    "targetDir": "todo",
    "openPath": "todo",
    "setupCommands": ["pnpm install"],
    "devCommand": "pnpm dev"
  }
}
```

Field rules:

- `targetDir` is the directory the command creates or the repo clone target.
- `openPath` is the workspace-relative path the local agent should work in. If omitted for `git`, `subdir` becomes `<targetDir>/<subdir>`.
- `setupCommands` run after the local agent changes into `openPath`.
- `devCommand` is advisory. The MCP server returns it in `starter`; it does not run it.
- `notes` are for agent-readable caveats like language versions, required accounts, or package manager choices.

## 3. Align step 1

The first step should agree with the starter:

- If `starter.kind` is `command`, step 1 should show the same init command or clearly explain the equivalent package-manager variants.
- If `starter.kind` is `git`, step 1 should explain what the starter contains, not ask the learner to create it from scratch.
- The first concrete checkpoint should have a stable `id` so MCP verification and browser progress share one key.
- For tracked tutorials, step 1 should explain that the sidebar track selector controls which starter MCP resolves. Do not duplicate the tutorial just to change the starter.

## 4. Add verification when possible

If step 1 has a machine-observable outcome, use `add-verify-checks`:

- `file_exists` for created files like `package.json`.
- `file_contains` for config or dependency checks.
- `shell` for commands that exit quickly, like test suites.
- `http` for local dev servers on `localhost`.

The `verify.id` must match the step's `<Checkpoint id="...">`.

## 5. Sanity check through MCP

After editing:

1. Run `pnpm check`.
2. Call or inspect `start_tutorial` for the tutorial slug.
3. Confirm the returned commands are safe to run from a blank workspace.
4. Confirm the first step returned by `start_tutorial` matches the tutorial's actual first step.
5. If step 1 has `verify`, complete the setup locally once and make sure an agent could collect each observation.

## Don't

- Don't put secrets or private clone URLs in `starter`.
- Don't use production URLs in `verify.http`; local checks must stay on `localhost`.
- Don't make the remote MCP server responsible for local filesystem changes.
- Don't add a starter if the tutorial is purely conceptual or hosted entirely in a browser playground.
- Don't duplicate large setup prose in `notes`; keep notes short and actionable.
