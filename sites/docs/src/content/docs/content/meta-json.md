---
title: _meta.json Reference
description: Reference every tutorial-level metadata field supported by Handzon.
---

Every tutorial folder has a `_meta.json` file. It describes the tutorial and configures cards, tracks, starters, AI behavior, and publishing.

```json
{
  "title": "Deploy a Python API",
  "description": "Wire a Flask API, containerize it, and ship to Render via a Blueprint.",
  "tags": ["python", "flask", "docker", "render"],
  "difficulty": "intermediate",
  "estimatedDuration": "40 min",
  "cover": "./assets/cover.svg",
  "icon": "🐍",
  "prerequisites": ["Comfortable in a terminal", "Python 3.11+ installed"]
}
```

## Fields

| Field | Required | Description |
| --- | --- | --- |
| `title` | Yes | Sidebar title, page title, and Open Graph title. |
| `description` | Yes | Landing-page subtitle and Open Graph description. |
| `published` | No | When `false`, tutorial routes, steps, homepage cards, and MCP access are not published. |
| `hidden` | No | When `true`, hides the tutorial from the homepage and MCP listing while keeping direct URLs available. |
| `tags` | No | Filter pills on the homepage. |
| `difficulty` | No | One of `beginner`, `intermediate`, or `advanced`. |
| `estimatedDuration` | No | Shown on landing pages and cards. If omitted, Handzon can sum step durations. |
| `prerequisites` | No | Bulleted list on the landing page. |
| `nextTutorial` | No | Slug of a follow-up tutorial. Renders a "Continue learning" card. |
| `cover` | No | Image used for tutorial cards, landing heroes, and social previews. |
| `icon` | No | Compact visual marker beside the tutorial title. Can be an image path or short text glyph. |
| `tracks` | No | Tutorial-wide programming-language tracks, such as Python and TypeScript. |
| `defaultTrack` | No | Default track id when no persisted learner choice applies. |
| `starter` | No | Shared starter spec or a per-track starter map for MCP-aware agents. |
| `gated` | No | When `true`, every step must register a `Checkpoint` to advance. |
| `ai` | No | Per-tutorial AI assistant overrides. |

## Visibility

Use `hidden: true` for unlisted previews that should still be shareable by URL.

Use `published: false` for drafts that should not appear anywhere in the generated site or MCP endpoint.

## Tracks and starters

When a tutorial declares tracks, `starter` can either be shared by every track or keyed by track id:

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
      "repo": "https://github.com/render-examples/flask-hello-world.git",
      "targetDir": "hello-python"
    },
    "ts": {
      "kind": "git",
      "repo": "https://github.com/render-examples/express-hello-world.git",
      "targetDir": "hello-typescript"
    }
  }
}
```

If you use a per-track map, include every declared track.
