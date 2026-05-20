# AGENTS.md

You're editing a tutorial site built with **Handzon**. This file is the single source of truth for project conventions. Read it before generating or modifying content.

## What this project is

A static Astro 5 + MDX site that publishes Google Codelab-style step-by-step tutorials with interactive components (quizzes, checkpoints, playgrounds), an AI assistant (built on **Mastra**), and a Render-friendly deploy story.

## Content model (read first)

Every tutorial lives in `src/content/tutorials/<NN-slug>/`:

```
src/content/tutorials/02-react-todo/
├── _meta.json            # tutorial-level config
├── 01-setup.mdx          → /react-todo/setup
├── 02-list.mdx           → /react-todo/list
└── assets/cover.png      # co-located assets (preferred)
```

- The numeric prefix on **folders** is the order tutorials appear on the homepage.
- The numeric prefix on **files** is the step order within a tutorial.
- The slug (everything after the prefix) becomes the URL segment.

### `_meta.json` fields

| field               | required | what it does |
| ------------------- | -------- | ------------ |
| `title`             | yes      | sidebar header, page title, OG meta |
| `description`       | yes      | landing-page subtitle, OG meta |
| `tags`              | no       | filter pills on the homepage |
| `difficulty`        | no       | `beginner` \| `intermediate` \| `advanced` |
| `estimatedDuration` | no       | shown on landing + cards; auto-summed from steps if omitted |
| `prerequisites`     | no       | bulleted list on the landing page |
| `nextTutorial`      | no       | slug of follow-up tutorial; renders "Continue learning" card |
| `cover` / `icon`    | no       | optimized via sharp; paths relative to the folder |
| `gated`             | no       | when `true`, every step must register a Checkpoint to advance |
| `ai`                | no       | per-tutorial assistant overrides (see "AI config" below) |

### Step frontmatter

```yaml
title: Set up the project        # required
duration: 5 min                  # optional; surfaces in the sidebar
summary: One-line teaser.        # optional; landing page + AI context
```

## MDX components (globally available — no imports needed)

| Component       | Type          | Use for |
| --------------- | ------------- | ------- |
| `<Callout>`     | static        | `type="info" \| "tip" \| "warn" \| "danger"` |
| `<Hint>`        | static        | `<details>`-backed collapsible solutions |
| `<Steps>`/`<Step>` | static     | numbered sub-steps inside a page |
| `<File>`        | static        | filename label (Expressive Code's `title="..."` is also fine) |
| `<Recap>`       | static        | `items={[...]}` end-of-step summary card |
| `<Embed>`       | static        | YouTube/Loom/Vimeo iframe (auto-privacy) |
| `<Download>`    | static        | styled link for `public/downloads/...` |
| `<Tabs>`/`<Tab>` | interactive  | npm/pnpm/yarn or macOS/Linux/Windows variants; use `group="..."` so selection persists across pages |
| `<FileTree>`    | interactive   | `paths={["a/b.ts", "a/c.ts"]}` |
| `<Reveal>`      | interactive   | lock content behind a click |
| `<Terminal>`    | interactive   | fake terminal — `entries=[{command, output}]` |
| `<Mermaid>`     | interactive   | client-side mermaid; for static diagrams use a `\`\`\`mermaid` fence |
| `<Diff>`        | interactive   | `before={...} after={...}` |
| `<Quiz>`        | interactive   | `question, options, answer (0-indexed), explanation` |
| `<Checkpoint>`  | interactive   | `label="I did X"` — gates the Next button when `gated: true` |
| `<Playground>`  | interactive   | Sandpack; JS/TS only in v1 |

### Code fences

Fenced code blocks use **Expressive Code**. Inherited features:
- `title="src/index.ts"` filename label
- `{2,4-6}` line highlights
- `lang="diff"` for `+`/`-` markers
- Multi-language: Python, SQL, Rust, Go, TypeScript, bash, HCL, YAML, etc. all highlight correctly

## Theming contract

**Never hardcode colors, radii, or fonts.** Use Tailwind utilities backed by the theme tokens in `src/styles/themes/`. Tokens live in a single `@theme {}` block per theme file; switch themes by editing one `@import` line in `src/styles/global.css`.

Available tokens (all CSS variables):

- Surfaces: `--color-bg`, `--color-fg`, `--color-muted`, `--color-border`, `--color-surface`
- Intent: `--color-accent`, `--color-accent-fg`, `--color-info`, `--color-tip`, `--color-warn`, `--color-danger`, `--color-success`
- Geometry: `--radius-{sm,md,lg}`, `--border-{default,thick}`
- Shadow: `--shadow-raised`, `--shadow-press`
- Type: `--font-sans`, `--font-mono`

## Asset placement

- **Co-locate** screenshots/diagrams next to the MDX file that uses them: `src/content/tutorials/<slug>/assets/foo.png`, reference with `./assets/foo.png`. This is the default.
- `src/assets/` — site-wide images that should be optimized (author avatars, brand art).
- `public/` — files that need stable, unhashed URLs and no processing (favicon, downloads, OG overrides).

## AI assistant config

The AI assistant is built on **Mastra** (not the Vercel AI SDK). Per-tutorial overrides go in `_meta.json` under `"ai"`:

```json
{
  "ai": {
    "enabled": true,
    "tone": "socratic",
    "references": ["./refs/cheatsheet.md"],
    "byok": "required",
    "disabledSkills": ["compare-approaches"]
  }
}
```

Defaults live in `src/config/ai.ts`. Anti-spoiler rule: the system prompt instructs the model to never reveal Quiz answers and to nudge before giving full Checkpoint solutions. Don't override the system prompt unless you preserve that rule.

## GitHub sign-in (optional, Tier 2)

Sign-in is gated on Tier 2 because the Auth.js tables live in Postgres.
When enabled at scaffold time, learners can sign in with GitHub and
their anonymous progress is **claimed** on first sign-in — a single
transaction re-keys their device-cookie progress to the user's learner
row and drops the device cookie.

To set it up:

1. Register an OAuth App at <https://github.com/settings/developers>.
   - Authorization callback URL (local): `http://localhost:4321/api/auth/callback/github`
   - Authorization callback URL (Render): `https://<your-domain>/api/auth/callback/github`
2. Fill in `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` in `.env`
   (local) or via the Render Dashboard (production).
3. Generate `AUTH_SECRET` once with `openssl rand -hex 32` and set
   `AUTH_TRUST_HOST=true` in production so Auth.js trusts Render's
   X-Forwarded-* headers.
4. Set `AUTH_URL` to your site's public origin in production (Render
   doesn't expose a fully-qualified-URL fromService property).

Subsequent sign-ins on a new device claim that device's anonymous
progress too, so a learner can roam without re-doing work.

## Common tasks

| You want to…                  | Run / use |
| ----------------------------- | --------- |
| Create a new tutorial          | `pnpm handzon:new` |
| Add a step to a tutorial       | `pnpm handzon:step` |
| Run the dev server             | `pnpm dev` |
| Build for production           | `pnpm build` |
| Type-check + Astro check       | `pnpm check` |
| Generate a DB migration (Tier 2) | `pnpm db:generate` |
| Run pending migrations         | `pnpm db:migrate` |

For multi-step authoring procedures, see the skills under `skills/` — each one is a short numbered procedure you can follow or have an agent follow.

## Don't

- Don't `import` MDX components — they're globally registered.
- Don't add inline `style` props in MDX for anything theme-related; use Tailwind utilities or component-level CSS.
- Don't skip a numeric prefix on a step file (`01-`, `02-`, … — gaps are fine but ordering is by prefix).
- Don't commit `.env` or any file with an API key.
- Don't put images in `public/` if they're tutorial-specific — co-locate them so they're picked up by the optimizer.
- Don't replace the brutalist theme by editing component CSS — create a new theme file under `src/styles/themes/` and import it from `global.css`.
