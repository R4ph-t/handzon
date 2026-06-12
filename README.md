# Handzon

Handzon helps you create and deploy your own hands-on tutorial website. Run the
CLI, write step-by-step lessons in MDX, add interactive checks and quizzes, then
publish the site on Render or any host that can run an Astro app.

A generated Handzon site includes:

- An Astro and MDX tutorial site with a ready-made content model.
- Interactive components for checkpoints, quizzes, code examples, tabs, recaps,
  and runnable playgrounds.
- Learner progress tracking, with browser-local progress by default and optional
  GitHub login plus Postgres-backed persistence for user accounts, cross-device
  sync, and cohort tracking.
- Optional AI tutor support through a standalone `handzon-ai` service.
- MCP tools so Cursor, Claude Code, Codex, and other agents can read tutorials,
  start local workspaces, and update learner progress.
- Render Blueprints for one-command infrastructure, with a portable codebase you
  can deploy elsewhere if you prefer.

## Documentation

The canonical Handzon docs live in `sites/docs`. Run them locally with:

```bash
pnpm docs:dev
```

The docs cover the content model, multi-language tracks, covers and media,
MDX components, verification, MCP, AI tutor configuration, theming, and deploys.

## Create a Tutorial Site

Scaffold a new site with the CLI:

```bash
npx create-handzon my-tutorials
cd my-tutorials
pnpm dev
```

The generated site runs at `http://localhost:4321`.

Add content from inside the generated project:

```bash
pnpm handzon:new     # create a tutorial
pnpm handzon:step    # add a step
pnpm handzon:skills  # install authoring skills into your agent
```

Tutorials live under `src/content/tutorials/<slug>/`. The generated project
includes `AGENTS.md`, which documents the content model, available MDX
components, theme tokens, AI configuration, and deployment files.

## Deploy

Handzon projects are designed to deploy cleanly on Render, but they are regular
Astro projects. You can host them on Render, another Node-compatible platform,
or your own infrastructure.

The generated project includes two Render Blueprints:

- `render.yaml` is the lightweight setup. It deploys the tutorial site and the
  optional AI service as web services. Learner progress stays in browser storage,
  so visitors can continue on the same device without needing accounts or a
  database.
- `render.full.yaml` is the persistence and login setup. It adds Postgres for
  server-side learner records and wires the login-backed progress features. This
  setup requires a GitHub OAuth app and the auth environment variables
  `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `AUTH_SECRET`, and
  `AUTH_TRUST_HOST`.

Both setups can expose the site's MCP endpoint at `/api/mcp`. The lightweight
setup works well for public tutorials and local progress. The full setup is a
better fit for cohort-based training, private workshops, or any site where
learner identity matters.

For other hosts, run the generated Astro app with the scripts in its
`package.json`. If you use the AI tutor, deploy the generated AI service too and
set the same environment variables that the Render Blueprints define.

```bash
pnpm build
pnpm preview
```

### Serving under a subpath

By default a Handzon site is served at the root of its domain. To host it under
a subpath instead (for example `example.com/tutorials`), set Astro's `base` in
`astro.config.mjs`:

```js
export default defineConfig({
  base: "/tutorials",
  // ...
});
```

Astro prefixes its own routes and `_astro/*` assets automatically, and
`handzon-core` threads the same base through its hand-written links, asset
URLs, and same-origin `/api/...` calls, so navigation, progress sync, and the
AI inbox keep working. Two more changes complete the setup:

- In `render.yaml` (Tier 2), set `healthCheckPath: /tutorials/healthz`. The
  platform health check hits the service directly, so it needs the prefix.
- If the site sits behind a reverse proxy on another domain, make sure the
  proxy preserves the prefix (forwards `/tutorials/...` unchanged rather than
  stripping it). Served directly on its own domain, the site lives at
  `your-host/tutorials/` with no extra work.

Asset props such as `logoUrl` and `faviconUrl` stay root-relative
(`/logo.svg`); core prefixes them at render. Absolute values (`https://`,
protocol-relative `//`, or `data:` URLs) pass through untouched.

## Repository Development

This repository is the Handzon monorepo. Use it when you want to change the CLI,
core framework, AI service, stdio MCP bridge, or default template.

Install dependencies, then run the default template locally:

```bash
pnpm install
pnpm template:dev
```

Build the CLI when you need to verify the published scaffold contents:

```bash
pnpm cli:build
```

## Packages

| Path | Package | Purpose |
| --- | --- | --- |
| `packages/create-handzon/` | `create-handzon` | CLI for scaffolding a site, adding tutorials, adding steps, and installing authoring skills. |
| `packages/core/` | `handzon-core` | Runtime framework: layouts, components, content schemas, MCP server tools, progress APIs, auth helpers, and shared styles. |
| `packages/ai/` | `handzon-ai` | Standalone Hono + Mastra AI backend with `/chat` and `/healthz`. |
| `packages/mcp-stdio/` | `handzon-mcp` | Stdio wrapper for clients that cannot connect to remote HTTP MCP servers directly. |
| `templates/default/` | private template | The Astro tutorial site that the CLI bundles into published scaffolds. |

## Common Commands

```bash
pnpm dev             # run the default template
pnpm template:build  # build the default template
pnpm cli:build       # bundle create-handzon and its template
pnpm check           # run Biome and Astro checks
pnpm test            # run workspace tests
pnpm fix             # apply Biome fixes
```

Package-specific commands also work with pnpm filters:

```bash
pnpm --filter handzon-core test
pnpm --filter create-handzon build
pnpm --filter handzon-ai build
```

## Generated Site Structure

Every project created with `create-handzon` starts from the site in
`templates/default/`. That starter includes tutorial content, settings pages,
Render Blueprints, MCP routes, progress APIs, and optional AI tutor wiring.

The most important generated files are:

- `AGENTS.md`, which documents the content model, MDX components, theme tokens,
  AI configuration, and deploy shape.
- `src/content/tutorials/`, where tutorial folders and step files live.
- `src/pages/settings/tokens.astro`, which exposes the MCP token setup flow to
  learners.
- `render.yaml` and `render.full.yaml`, which define the Render deployment
  options.

This repo also keeps authoring skills in `templates/default/skills/`. The
published CLI does not copy those skill files directly into new projects. It
prompts users to install them into their local agent environment instead.

## How the CLI Bundles the Template

`create-handzon` copies `templates/default/` into
`packages/create-handzon/dist/template` during `pnpm cli:build`. The build
filters out local-only directories such as `node_modules`, `.astro`, `dist`,
`.cursor`, `.claude`, and `skills`.

The template uses workspace dependencies during monorepo development:

```json
{
  "handzon-core": "workspace:*",
  "handzon-ai": "workspace:*"
}
```

During the CLI build, those references are rewritten to the current package
versions from `packages/core/package.json` and `packages/ai/package.json`. This
means `handzon-core` must be versioned before you build and publish
`create-handzon`.

## MCP Setup

Every generated Handzon site exposes a Model Context Protocol endpoint at
`/api/mcp`. MCP-aware editors can use it to browse tutorials, read step source,
start a tutorial from a blank workspace, and update progress.

The generated site includes the setup page at `/settings/tokens`:

1. Sign in with GitHub.
2. Create a scoped personal access token.
3. Pick your editor to copy an install command or config block.

Use `progress:read` when an agent only needs to inspect tutorial state. Add
`progress:write` when the agent should mark checkpoints, record quiz results,
submit verification results, or send help requests to the in-browser tutor.

For clients that support remote MCP over HTTP, configure the deployed site
directly:

```jsonc
{
  "mcpServers": {
    "handzon": {
      "url": "https://<your-site>/api/mcp",
      "headers": {
        "Authorization": "Bearer hzn_pat_xxxxxxxxxxxxxxxxxxxxxxxx"
      }
    }
  }
}
```

Claude Desktop and older clients can use the published stdio bridge:

```jsonc
{
  "mcpServers": {
    "handzon": {
      "command": "npx",
      "args": [
        "-y",
        "handzon-mcp@latest",
        "--site",
        "https://<your-site>",
        "--token",
        "hzn_pat_xxxxxxxxxxxxxxxxxxxxxxxx"
      ]
    }
  }
}
```

Available read tools: `list_tutorials`, `get_tutorial`, `start_tutorial`,
`get_step`, and `get_progress`.

Available write tools: `complete_checkpoint`, `uncheck_checkpoint`,
`complete_step`, `mark_step_incomplete`, `record_quiz`, `set_last_visited`,
`set_preference`, `request_help`, and `submit_verification`.

## Release Flow

Use Changesets for package versions and npm publishing.

For a normal future release:

```bash
pnpm changeset
pnpm version-packages
pnpm release
```

What each command does:

- `pnpm changeset` records which packages changed and whether each package needs
  a patch, minor, or major bump.
- `pnpm version-packages` applies those bumps, updates changelogs, and refreshes
  the lockfile.
- `pnpm release` runs `pnpm check`, runs `pnpm test`, and publishes bumped
  packages with `changeset publish`.

If package versions were already bumped manually for a release, do not run
`pnpm version-packages` for that same release. Run `pnpm release` after
verification.

## Release Notes

`changeset publish` does not support a dry-run flag. To inspect pending bumps,
run:

```bash
pnpm changeset status
```

To test versioning behavior without publishing, use a disposable branch or stash
your work first, then run:

```bash
pnpm changeset version --snapshot dry-run
```

That command edits package versions and lockfiles, so only use it when you can
discard the edits.

## Publish Order

Changesets publishes the packages that have unpublished versions. Keep these
relationships in mind when choosing changesets:

- Bump `handzon-core` when you change runtime APIs, schemas, components, styles,
  MCP tools, server behavior, or exported types.
- Bump `create-handzon` when you change CLI code or anything in
  `templates/default/`, because the published CLI bundles that template.
- Bump `handzon-ai` only when the standalone AI backend changes.
- Bump `handzon-mcp` only when the stdio wrapper changes.

When `handzon-core` and `create-handzon` both change, publish `handzon-core`
first. The CLI package needs the final `handzon-core` version baked into its
bundled template.

## Generated Projects

After publishing, verify a fresh scaffold before announcing the release:

```bash
npx create-handzon@latest my-tutorials
cd my-tutorials
pnpm dev
```

Inside a generated project, authors can run:

```bash
pnpm handzon:new
pnpm handzon:step
pnpm handzon:skills
```

See `packages/create-handzon/README.md` for CLI details and
`templates/default/README.md` for the generated site's user-facing guide.

## Architecture Notes

See `.cursor/plans/tutorial-tool_scaffold_cli_bcb464fd.plan.md` for the original
scaffold architecture plan. Current release history lives in `CHANGELOG.md`.
