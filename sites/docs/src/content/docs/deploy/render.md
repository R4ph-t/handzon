---
title: Deploy on Render
description: Choose between the lightweight and full Render Blueprints, configure auth, and serve under a subpath.
---

Handzon projects are regular Astro apps, but generated projects include Render Blueprints for the common deployment shapes.

## Blueprint options

`render.yaml`
: Lightweight setup. Deploys the tutorial site and optional AI service as web services. Learner progress stays in browser storage.

`render.full.yaml`
: Full setup. Adds Postgres for server-side learner records, GitHub sign-in, cross-device progress sync, MCP tokens, and cohort tracking.

Use the lightweight setup for public tutorials and local progress. Use the full setup for private workshops, cohort training, or any site where learner identity matters.

## Lightweight setup

The lightweight setup is the simplest path:

- No Postgres.
- Browser-local progress.
- Optional AI service.
- MCP endpoint can still be exposed, but token-backed write flows require the full setup.

## Full setup

The full setup adds:

- Render Postgres.
- GitHub sign-in through Auth.js.
- Server-side learner records.
- Cross-device progress sync.
- MCP personal access tokens.

Required environment variables:

```text
GITHUB_CLIENT_ID
GITHUB_CLIENT_SECRET
AUTH_SECRET
AUTH_TRUST_HOST=true
```

Create `AUTH_SECRET` once:

```bash
openssl rand -hex 32
```

## GitHub OAuth callback URLs

For local development:

```text
http://localhost:4321/api/auth/callback/github
```

For production:

```text
https://<your-domain>/api/auth/callback/github
```

If the site is served under a subpath, include the subpath:

```text
https://<your-domain>/tutorials/api/auth/callback/github
```

## Serving under a subpath

To host at `example.com/tutorials`, set Astro's `base`:

```js
export default defineConfig({
  base: "/tutorials",
});
```

Astro prefixes routes and `_astro/*` assets. `handzon-core` prefixes its own links, asset URLs, and same-origin `/api/...` calls with the same base.

Also update the Render health check path:

```yaml
healthCheckPath: /tutorials/healthz
```

If a reverse proxy sits in front of the app, make sure it preserves the prefix. It should forward `/tutorials/...` unchanged rather than stripping it.

## Other hosts

Handzon can run anywhere that can run an Astro Node app:

```bash
pnpm build
pnpm preview
```

If you deploy the optional AI tutor service, deploy it alongside the tutorial site and set the same environment variables that the Render Blueprints define.
