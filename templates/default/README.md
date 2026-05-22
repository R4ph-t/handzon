# __PROJECT_NAME__

A hands-on, step-by-step tutorial site, built with [Handzon](https://github.com/R4ph-t/handzon).

## Getting started

```bash
pnpm install
pnpm dev          # http://localhost:4321
```

## Authoring

```bash
pnpm handzon:new     # create a new tutorial
pnpm handzon:step    # add a step to an existing tutorial
```

Tutorials live under `src/content/tutorials/<slug>/`. See `AGENTS.md` for the full content model + component catalog.

## Theming

The active theme lives in `src/styles/global.css`. The default is `brutalist-dark`. Swap one `@import` line to switch.

## Configuration

Copy the example env files before running the dev server:

```bash
cp .env.example .env
cp services/ai/.env.example services/ai/.env
```

Both `PUBLIC_AI_SERVICE_URL` and `ALLOWED_ORIGIN` accept either a fully-qualified URL (for local dev or custom domains) or a bare Render private-network hostname — the latter is what `fromService.property: host` ships in the Blueprints, and the code expands it to `https://<host>.onrender.com` at runtime.

Optional GitHub sign-in (Tier 2 only) reads `AUTH_SECRET`,
`AUTH_TRUST_HOST`, `GITHUB_CLIENT_ID`, and `GITHUB_CLIENT_SECRET`.
The public URL is derived automatically from `RENDER_EXTERNAL_URL`
on Render; set `AUTH_URL` only when you need to override (custom
domain or reverse proxy). See `.env.example` and the "GitHub sign-in"
section of `AGENTS.md` for the full setup.

## Deploying

Two Blueprints ship in this repo:

- `render.yaml` — Tier 1: site + AI service as Node web services. Progress lives in localStorage. AI keys can be left unset to force BYOK-only.
- `render.full.yaml` — Tier 2: adds Postgres for cross-device progress sync. Run `pnpm db:migrate` once after the first deploy (the Blueprint wires it as a post-deploy hook).

After the first deploy, set the AI provider keys on the `<project>-ai` service in the Render Dashboard. The site reaches the AI service through `PUBLIC_AI_SERVICE_URL` (a `fromService.property: host` reference); browser code expands that to `https://<host>.onrender.com` automatically. Custom domain? Override the value to your full origin and it'll be used as-is.

## MCP — connect external agents

Your deployed site exposes a Model Context Protocol endpoint at `/api/mcp`. Cursor, Claude Code, Claude Desktop, Codex, and any other MCP-aware client can browse tutorials, read step source, and (with a personal access token) mark checkpoints, record quizzes, and post help requests into the in-browser tutor's inbox.

### 1. Sign in and mint a token

1. Sign in to your deployed site with GitHub.
2. Visit `/settings/tokens`, enter a name, pick scopes (`progress:read` and/or `progress:write`), and create a token.
3. Copy the `hzn_pat_…` value — it's shown only once.

### 2. Configure your client

**Remote MCP (Cursor, Claude Code with `mcp.json`)**:

```jsonc
// ~/.cursor/mcp.json  or  .cursor/mcp.json in your project
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

**Stdio bridge (Claude Desktop, older clients)** — uses the published `handzon-mcp` wrapper:

```jsonc
// ~/Library/Application Support/Claude/claude_desktop_config.json
{
  "mcpServers": {
    "handzon": {
      "command": "npx",
      "args": ["-y", "handzon-mcp@latest", "--site", "https://<your-site>", "--token", "hzn_pat_…"]
    }
  }
}
```

### 3. Available tools

Reads (any token): `list_tutorials`, `get_tutorial`, `get_step`, `get_progress`.

Writes (require `progress:write`): `complete_checkpoint`, `uncheck_checkpoint`, `complete_step`, `mark_step_incomplete`, `record_quiz`, `set_last_visited`, `set_preference`, `request_help`.

`request_help` is the bridge: an agent in your editor can say "the learner is stuck on X" and that message lands in the browser tutor's inbox on next open.

### 4. Live sync (single instance)

Progress writes from MCP fan out to a per-learner Server-Sent-Events channel (`/api/progress/events`) so the open browser tab sees them within one event-loop tick. The in-memory bus is **single-instance**: if you scale the web service horizontally on Render, a write landing on instance A is invisible to a subscriber on instance B. v2 will swap the in-memory bus for Postgres `LISTEN/NOTIFY` (no new dependency — Postgres is already in the stack).
