# Handzon

A pnpm-workspaces monorepo with two products:

- **`packages/create-handzon/`** — the published CLI (`npx create-handzon my-codelab`). Scaffolds + grows hands-on tutorial projects.
- **`templates/default/`** — the Astro 5 + MDX template the CLI copies. Self-contained, runnable on its own.

## Quick start

```bash
pnpm install
pnpm template:dev   # run the default template locally
pnpm cli:build      # bundle the CLI
```

See the plan in `.cursor/plans/tutorial-tool_scaffold_cli_bcb464fd.plan.md` for the full architecture.
