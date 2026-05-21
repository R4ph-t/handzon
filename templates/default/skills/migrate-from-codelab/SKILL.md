---
name: migrate-from-codelab
description: Convert an existing Google Codelab repo (claat-style .md) into a Handzon tutorial.
triggers: ["migrate codelab", "import codelab", "codelab to mdx", "claat", "from codelab"]
---

Google Codelabs are authored as a single `codelab.md` with `claat` metadata + `##`-delimited steps. Handzon splits each step into its own MDX file and wraps step bodies in components. This skill walks through the mechanical conversion.

## 0. Locate the source

Ask the author for the codelab. The two common shapes:

- A single `.md` (e.g. `codelab.md`, `index.md`) at the repo root with `claat` frontmatter.
- A folder per codelab with the `.md` next to an `img/` directory.

If they have a published `claat` URL but no source, fetch it: `claat export <google-doc-id>` first. Don't try to scrape the HTML page — round-tripping breaks fences.

## 1. Parse the top-level metadata

`claat`-style frontmatter looks like:

```
summary: Build a chat app with Firebase
id: build-chat-app
categories: web, firebase
tags: web, firebase, javascript
status: published
authors: Ada Lovelace
feedback link: https://github.com/...
```

Map these to `_meta.json`:

| codelab field      | Handzon `_meta.json` |
| ------------------ | --------------------------- |
| `summary`          | `description`               |
| `id` / first `##`  | folder slug                 |
| first line / title | `title`                     |
| `categories`/`tags`| `tags`                      |
| `authors`          | `author.name`               |
| `feedback link`    | `feedbackUrl`               |
| `status`           | (drop — not used)           |

`difficulty` isn't in codelabs — ask the author or default to `beginner`.

## 2. Split steps

Every `## <Title>` h2 starts a new step. The line right after the heading is usually `Duration: M:SS` — convert to `M min` (round up) in step frontmatter.

For a codelab with N steps, produce:

```
src/content/tutorials/<slug>/
├── _meta.json
├── 01-<slugified-step-1>.mdx
├── 02-<slugified-step-2>.mdx
└── …
```

After creating the folder, append `<slug>` to the `order` array in `src/content/tutorials/_index.json` (create the file with `{ "order": [] }` if missing) so the tutorial appears on the homepage in the position you want.

Each step file's frontmatter:

```yaml
---
title: <h2 title verbatim>
duration: <converted duration>
summary: <first sentence of the step, optional>
---
```

## 3. Convert codelab syntax to MDX

| codelab                          | Handzon                                        |
| -------------------------------- | ---------------------------------------------- |
| `Positive\n: tip text…`          | `<Callout type="tip">tip text…</Callout>`      |
| `Negative\n: warn text…`         | `<Callout type="warn">warn text…</Callout>`    |
| `Duration: 5:00` (step-level)    | `duration: 5 min` in frontmatter (drop body)   |
| `### Subhead`                    | `### Subhead` (keep — MDX renders it)          |
| Fenced code (`\`\`\`js`)         | Fenced code (`\`\`\`js`) — Expressive Code     |
| Image `![alt](img/foo.png)`      | Image `![alt](./assets/foo.png)` + copy file   |
| `aside class="positive"`         | `<Callout type="tip">`                         |
| `aside class="warning"`          | `<Callout type="warn">`                        |
| `aside class="special"`          | `<Callout type="info">`                        |
| Survey forms (`## Survey`)        | Drop (no Handzon equivalent in v1)             |

## 4. Add Handzon affordances at the end of each step

Codelabs don't have checkpoints or recaps. Add them — they're high-value for retention:

```mdx
<Checkpoint label="I finished this step." />

<Recap items={[
  "Key thing from this step",
  "Another key thing"
]} />
```

If the author wants gated progression, also set `"gated": true` in `_meta.json`.

## 5. Move images

Codelabs reference images via `img/foo.png` relative paths. Copy them to `src/content/tutorials/<slug>/assets/` and update markdown links to `./assets/foo.png`. Astro's image pipeline will optimize them automatically.

If the codelab has a hero image, set it as `cover` in `_meta.json`.

## 6. Pick at least one quiz

Codelabs rarely have quizzes. Identify ONE concept from each step that you'd want a learner to be able to verify, and author a `<Quiz>` block (see the `add-quiz` skill). Don't force them on every step — distractor quality matters more than count.

## 7. Verify

```bash
pnpm dev
```

Click through every step. Common issues to look for:

- Broken image paths (still pointing at `img/`).
- Code fences that lost their language hint (Expressive Code shows them as plain text).
- `Positive`/`Negative` blocks that weren't converted (they'll render as broken markdown).
- Steps where the imported h2 title also appears as the first line of the body — drop the duplicate.

## 8. Wire AI references (optional)

If the codelab links to API docs, drop the doc URLs into `_meta.json.ai.references` so the assistant has them in context. `llms.txt` URLs work well here.

## Quick checklist

- [ ] `_meta.json` written with title, description, tags, author, feedback URL.
- [ ] Tutorial slug appended to `src/content/tutorials/_index.json`'s `order` array.
- [ ] One MDX file per `##` step, numeric-prefixed.
- [ ] Step `duration` in frontmatter (codelab `Duration: M:SS` → `M min`).
- [ ] All `Positive`/`Negative` blocks converted to `<Callout>`.
- [ ] Images copied to `./assets/` and links updated.
- [ ] Each step ends with `<Checkpoint>` + `<Recap>`.
- [ ] At least one `<Quiz>` per tutorial.
- [ ] `pnpm dev` clicks through end-to-end with no console errors.
