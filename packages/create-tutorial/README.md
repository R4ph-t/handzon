# create-tutorial

CLI for scaffolding and growing [tutorial-tool](../../README.md) projects.

```bash
npx create-tutorial my-codelab        # scaffold a new project
cd my-codelab
pnpm tutorial:new                     # add a tutorial
pnpm tutorial:step                    # add a step
```

## Subcommands

| command                  | what it does |
| ------------------------ | ------------ |
| `create-tutorial [name]` | scaffold a new project (`init`, the default) |
| `create-tutorial new`    | add a tutorial to the current project |
| `create-tutorial step`   | add a step to an existing tutorial |

Add `--yes` to any of them to skip prompts and accept defaults.

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
