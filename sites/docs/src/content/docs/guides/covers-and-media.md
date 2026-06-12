---
title: Covers and Media
description: Add tutorial covers, icons, step hero media, embedded videos, and slide decks.
---

Covers help learners pick a tutorial from the homepage. Hero media and embeds give visual context inside a step.

## Asset placement

Co-locate tutorial-specific assets next to the tutorial that uses them:

```text
src/content/tutorials/deploy-python-api/
├── _meta.json
├── 01-flask-app.mdx
└── assets/
    ├── cover.svg
    └── deploy-dashboard.svg
```

Reference co-located assets with relative paths:

```json
{
  "cover": "./assets/cover.svg"
}
```

Use `src/assets/` for site-wide optimized images, such as author avatars or brand art. Use `public/` only for stable, unhashed files such as favicons, downloads, or manually managed Open Graph images.

## Tutorial covers

Set `cover` in `_meta.json` to add a card image, landing hero image, and social preview media:

```json
{
  "title": "Deploy a Python API",
  "cover": "./assets/cover.svg"
}
```

Good covers are specific to the tutorial outcome: a dashboard screenshot, architecture sketch, final app UI, or branded illustration. Avoid generic stock art.

## Tutorial icons

Use `icon` for a compact marker beside the tutorial title:

```json
{
  "icon": "🐍"
}
```

`icon` can be a short text glyph or an image path. Keep text icons short so cards and sidebars stay balanced.

## Step hero media

Use `heroMedia` in step frontmatter when the first thing a learner needs is visual context.

### Image

```yaml
heroMedia:
  kind: image
  src: ./assets/deploy-dashboard.svg
  alt: Render Dashboard showing a deployed Flask API
```

Image hero media requires `alt`.

### Video

```yaml
heroMedia:
  kind: video
  src: https://www.youtube.com/embed/abc123
  title: Deploy walkthrough
  aspect: 16/9
  type: iframe
```

Video hero media requires `title`.

### Slides

```yaml
heroMedia:
  kind: slides
  src: https://docs.google.com/presentation/d/abc123/embed
  title: Architecture deck
  aspect: 16/9
  slide: id.g3eeba9b965c_0_43
```

Slide decks are useful when a step opens with architecture or conceptual context. The optional `slide` field starts the deck at a specific point. For Google Slides, use a slide number or an `id.<objectId>` value.

## Inline embeds

Use `<Embed>` for hosted video or slides that should appear inside the lesson body instead of at the top:

```mdx
<Embed
  type="slides"
  src="https://docs.google.com/presentation/d/abc123/embed"
  title="Architecture deck"
  slide="4"
/>
```

For video providers, prefer privacy-preserving embed URLs when available. Handzon rewrites supported YouTube embeds to the no-cookie host.

## Downloads

Use `<Download>` for files that learners need to save:

```mdx
<Download href="/downloads/example.zip">Download the starter archive</Download>
```

Put stable downloadable files in `public/downloads/`.
