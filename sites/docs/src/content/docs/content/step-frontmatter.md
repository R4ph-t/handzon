---
title: Step Frontmatter
description: Configure titles, summaries, hero media, and verification specs for individual steps.
---

Every step is an MDX file with frontmatter:

```mdx
---
title: Set up the project
duration: 5 min
summary: Install dependencies and start the local dev server.
---

Step content starts here.
```

## Core fields

| Field | Required | Description |
| --- | --- | --- |
| `title` | Yes | Step heading, sidebar label, and page title. |
| `duration` | No | Small duration label in the sidebar and step header. |
| `summary` | No | Landing-page teaser and AI context. |
| `heroMedia` | No | First visual element in the step: image, video, or slide deck. |
| `verify` | No | Machine-verifiable checks associated with a checkpoint. |

## Hero media

Use `heroMedia` when the step should open with a screenshot, diagram, walkthrough video, or slide deck.

Image hero media requires `alt`:

```yaml
heroMedia:
  kind: image
  src: ./assets/setup.png
  alt: Terminal showing the local dev server
```

Video hero media requires `title`:

```yaml
heroMedia:
  kind: video
  src: https://www.youtube.com/embed/...
  title: Walkthrough video
  aspect: 16/9
  type: iframe
```

Slide decks also use `title`. For Google Slides, `slide` can be a slide number or an `id.<objectId>` value:

```yaml
heroMedia:
  kind: slides
  src: https://docs.google.com/presentation/d/abc123/embed
  title: Architecture deck
  aspect: 16/9
  slide: 4
```

Use inline Markdown images for supporting screenshots later in the step. Use `<Embed>` for inline videos or slide decks that should appear after the introduction.

## Verification

`verify` attaches machine-checkable proof to a checkpoint. The `id` must match a `<Checkpoint id="...">` in the step body.

```yaml
verify:
  id: app/tests-pass
  cwd: "$LEARNER_PROJECT"
  checks:
    - kind: file_exists
      path: package.json
    - kind: shell
      run: npm test
      expect:
        exitCode: 0
```

Track-specific verification uses the track id as the top-level key:

```yaml
verify:
  py:
    id: hello/tests-pass
    checks:
      - kind: shell
        run: python -m pytest
        expect:
          exitCode: 0
  ts:
    id: hello/tests-pass
    checks:
      - kind: shell
        run: npm test
        expect:
          exitCode: 0
```
