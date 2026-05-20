---
name: add-playground
description: Embed a Sandpack playground (JS/TS only in v1).
triggers: ["add playground", "embed playground", "sandpack"]
---

1. Pick the right template:
   - `react-ts` — React + TS (default; what most tutorials use)
   - `react` — React + JS
   - `vanilla-ts` / `vanilla` — no framework
   - `vue` / `svelte` — those frameworks
2. Build the `files` map. Keys are **absolute** in the playground's virtual FS (`/App.tsx`, `/index.css`).
3. Keep the initial code **runnable**. A broken initial state is a bad first impression.
4. Use template-literal strings; escape backticks inside them.

```mdx
<Playground template="react-ts" files={{
  "/App.tsx": `export default function App() {
  return <h1>Hello!</h1>
}`,
  "/styles.css": `body { font-family: system-ui; }`
}} />
```

**Limit:** non-JS languages (Python, SQL, Rust, Go) are display-only via Expressive Code in v1. Use a `<Terminal>` to show output instead.
