---
title: Multi-Language Tracks
description: Use one tutorial to support multiple programming-language paths without duplicating shared prose.
---

Tracks are tutorial-wide programming-language variants. Use them when one tutorial should support Python and TypeScript, or Go and Rust, while keeping the structure and progress shared.

A track is the learner's chosen path through the tutorial. It is different from a code fence `lang`, which only controls syntax highlighting.

## Declare tracks

Declare tracks in `_meta.json`:

```json
{
  "title": "Multi-track Hello API",
  "tracks": [
    { "id": "py", "label": "Python" },
    { "id": "ts", "label": "TypeScript" }
  ],
  "defaultTrack": "py"
}
```

When a tutorial declares two or more tracks, Handzon renders a selector in the sidebar. The active track resolves in this order:

1. Explicit learner choice.
2. Persisted `prefs.track`, if this tutorial offers that track.
3. `defaultTrack`.
4. The first declared track.

Progress is shared across tracks. A learner can switch from Python to TypeScript and keep the same completed steps and checkpoints.

## Wrap track-specific content

Use `<Track id="...">` around prose, code fences, terminals, file trees, or playgrounds that apply only to one track:

````mdx
Shared introduction that everyone sees.

<Track id="py">

```python title="app.py"
from flask import Flask
```

</Track>

<Track id="ts">

```ts title="src/server.ts"
import express from "express";
```

</Track>
````

Keep shared prose outside `<Track>`. Do not duplicate step structure unless the tracks truly need different instructions.

## Tracks vs Tabs

Use tracks for tutorial-wide language choices:

- Python vs TypeScript.
- Flask vs Express.
- Terraform vs Pulumi.

Use `<Tabs>` for local choices inside a step:

- npm vs pnpm vs yarn.
- macOS vs Linux vs Windows.
- cURL vs HTTPie.

Do not use Tabs as a tutorial-wide language selector. Tabs do not change MCP starter resolution or track-specific verification.

## Per-track starters

`starter` can be a single shared starter or a map keyed by track id:

```json
{
  "starter": {
    "py": {
      "kind": "git",
      "repo": "https://github.com/render-examples/flask-hello-world.git",
      "targetDir": "hello-python",
      "setupCommands": [
        "python -m venv .venv",
        ". .venv/bin/activate && pip install -r requirements.txt pytest"
      ],
      "devCommand": ". .venv/bin/activate && flask run"
    },
    "ts": {
      "kind": "git",
      "repo": "https://github.com/render-examples/express-hello-world.git",
      "targetDir": "hello-typescript",
      "setupCommands": ["npm install"],
      "devCommand": "npm start"
    }
  }
}
```

MCP-aware agents use the active track when starting a tutorial, so a learner on the Python track gets the Python starter.

## Per-track verification

Use track ids under `verify` when each track needs different checks:

```yaml
verify:
  py:
    id: hello/tests-pass
    cwd: "$LEARNER_PROJECT"
    checks:
      - kind: file_exists
        path: app.py
      - kind: shell
        run: python -m pytest
        expect:
          exitCode: 0
  ts:
    id: hello/tests-pass
    cwd: "$LEARNER_PROJECT"
    checks:
      - kind: file_exists
        path: package.json
      - kind: shell
        run: npm test
        expect:
          exitCode: 0
```

Use the same checkpoint id when the learner outcome is the same across tracks:

```mdx
<Checkpoint id="hello/tests-pass" label="The tests pass for my selected track." />
```

The verifier runs only the active track's checks.

## Naming rules

- Use stable, short ids like `py`, `ts`, `go`, or `rust`.
- Use human labels like `Python` or `TypeScript`.
- Do not call this `lang`; `lang` is for syntax highlighting.
- If you use per-track `starter` or `verify`, include every declared track.
