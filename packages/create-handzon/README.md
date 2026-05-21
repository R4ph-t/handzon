# create-handzon

CLI for scaffolding and growing [Handzon](../../README.md) projects.

```bash
npx create-handzon my-tutorials        # scaffold a new project
cd my-tutorials
pnpm handzon:new                     # add a tutorial
pnpm handzon:step                    # add a step
```

## Subcommands

| command                  | what it does |
| ------------------------ | ------------ |
| `create-handzon [name]` | scaffold a new project (`init`, the default) |
| `create-handzon new`    | add a tutorial to the current project |
| `create-handzon step`   | add a step to an existing tutorial |
| `create-handzon skills` | install Handzon authoring skills into your AI agent (Cursor, Claude Code, Codex, …) |

Add `--yes` to any of them to skip prompts and accept defaults.

## Skills

Authoring skills (e.g. `add-tutorial`, `add-quiz`, `deploy-to-render`) are not copied into the scaffold. They're installed on demand via the [skills](https://www.npmjs.com/package/skills) CLI so they land in your agent's per-tool location (e.g. `~/.cursor/skills/`, `~/.claude/skills/`) rather than as inert files in the repo. Run the prompt during `create-handzon`, or do it later with `pnpm handzon:skills`.

## How `init` works

1. Resolves the bundled template directory (`dist/template/` in the published package, `../../templates/default` in monorepo dev).
2. `fs.cp(templateDir, targetDir, {recursive: true, filter})` — skips `node_modules`, `.astro/`, build output.
3. Token-replaces `__PROJECT_NAME__` in `package.json`, `README.md`, and the Render Blueprints.
4. Applies the user's answers: swaps theme `@import`, rewrites `src/config/ai.ts`, picks Tier 1 vs Tier 2 Blueprint.
5. Spawns the chosen package manager's `install`.
6. Runs `git init`.

## Tests

```bash
pnpm test
```
