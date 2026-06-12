---
title: Tutorials and Steps
description: Understand Handzon's file-based tutorial model, step ordering, and homepage ordering.
---

A Handzon tutorial is a folder under `src/content/tutorials/`.

```text
src/content/tutorials/react-todo/
├── _meta.json
├── 01-setup.mdx
├── 02-list.mdx
└── assets/
    └── cover.png
```

The folder name is the tutorial slug and URL segment. Do not add a numeric prefix to the folder name.

## Step files

Each numbered `.mdx` file becomes one step page:

```text
01-setup.mdx  -> /react-todo/setup
02-list.mdx   -> /react-todo/list
```

The number is only for sorting. It does not appear in the route.

Use gaps if you expect to insert steps later:

```text
010-intro.mdx
020-build.mdx
030-deploy.mdx
```

## Homepage order

Homepage order comes from `src/content/tutorials/_index.json`:

```json
{
  "order": ["authoring-101", "react-todo", "intro-to-sql"]
}
```

Listed tutorials appear first in the order shown. Any tutorial not listed is appended after, sorted alphabetically by slug.

`pnpm handzon:new` appends new tutorials to `order` automatically. Reorder tutorials by editing the array.

## Published and hidden tutorials

Use `_meta.json` visibility fields when you need drafts or direct-link previews:

- `published: false` removes the tutorial from routes, homepage cards, and MCP listings.
- `hidden: true` hides the tutorial from the homepage and MCP listing while keeping direct URLs available.

Use `hidden` for private previews. Use `published: false` for drafts that should not be reachable.
