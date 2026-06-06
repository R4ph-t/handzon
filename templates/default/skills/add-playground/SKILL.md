---
name: add-playground
description: Embed a Sandpack `<Playground>` for runnable JS/TS code inside a step. Covers when to use it, template selection, the `files` map (including hidden setup files), adding third-party `dependencies`, sizing, and the per-page performance budget.
triggers: ["add playground", "embed playground", "sandpack", "interactive code", "runnable example"]
---

Use this when the author wants the reader to *run* code inside the step — edit, save, see the result — not just read it.

## 1. Decide if a playground belongs here

A `<Playground>` is the right tool when **all** of these are true:

- The example is small enough to fit on screen (≤ ~50 lines across all files).
- Running and tweaking the code is part of the learning, not optional.
- The example is in **JavaScript or TypeScript** (or a framework that compiles to JS — see section 2). v1 does not ship Python/SQL/Rust/Go playgrounds.

If the reader just needs to see the code, use a fenced code block with `title="..."`. If the reader needs to run a command and see output but not edit code, use `<Terminal>`. Playgrounds are heavier than both — pick them deliberately.

**Non-JS languages:** Python, SQL, Rust, Go, and others are display-only via Expressive Code in v1. Use `<Terminal>` to show their output. Don't try to fake a Python playground with a JS sandbox.

**Tracked tutorials:** If a tutorial declares `tracks`, wrap playgrounds in `<Track id="...">` when they apply to one track. Sandpack still runs JS/TS only, so a Python track should usually use fenced code blocks and `<Terminal>` output instead of a playground.

```mdx
<Track id="ts">
  <Playground template="node" files={{
    "/index.ts": `console.log("Hello from TypeScript");`
  }} />
</Track>
```

## 2. Pick the template

The `template` prop accepts any Sandpack template. The common ones for Handzon tutorials:

- **`react-ts`** (default) — React + TypeScript. Use this for most React tutorials.
- **`react`** — React + JavaScript. Use when the tutorial is JS-only and TS would be a distraction.
- **`vanilla-ts`** / **`vanilla`** — no framework, just `index.ts` / `index.js`. Use for "how does this language feature work" examples.
- **`vue`** / **`vue-ts`** — Vue 3 SFC.
- **`svelte`** — Svelte.
- **`node`** — Node.js runtime (no DOM). Use for backend examples.

Match the template to the tutorial's stack. Mixing a `react-ts` playground into a Vue tutorial creates a mental context switch.

## 3. Build the `files` map

Keys are **absolute paths** in the playground's virtual filesystem (leading `/`). The component accepts two value forms:

- **String** — file contents, shown in the editor tabs.
- **Object** — `{ code: string, hidden?: boolean }`. Use `hidden: true` for setup files (config, package.json overrides, helpers) that should exist in the sandbox but not clutter the editor.

```mdx
<Playground
  template="react-ts"
  files={{
    "/App.tsx": `import { useState } from "react";
export default function App() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount((c) => c + 1)}>Clicked {count} times</button>;
}`,
    "/styles.css": `body { font-family: system-ui; padding: 2rem; }`,
    "/setup.ts": { code: `// hidden setup the reader doesn't need to see`, hidden: true },
  }}
/>
```

Rules:

- **Initial state must run.** A playground that boots with a syntax error is a bad first impression. Test the snippet locally before pasting it in.
- **Use template-literal strings** (backticks) for multi-line code. Escape inner backticks with `\``.
- **Don't include `package.json`** unless you're overriding dependencies — let the template provide it (see section 4 for dependencies).
- **Keep the visible files focused.** If the reader has to scroll through `index.tsx` to find the line that matters, hide the boilerplate (`hidden: true`) and put the teaching code in `/App.tsx`.

## 4. Adding third-party dependencies

For libraries beyond what the template ships, use the `dependencies` prop. Keys are package names, values are version strings (semver ranges work).

```mdx
<Playground
  template="react-ts"
  dependencies={{ "zustand": "^4.5.0" }}
  files={{
    "/store.ts": `import { create } from "zustand";
export const useStore = create<{ count: number; inc: () => void }>((set) => ({
  count: 0,
  inc: () => set((s) => ({ count: s.count + 1 })),
}));`,
    "/App.tsx": `import { useStore } from "./store";
export default function App() {
  const { count, inc } = useStore();
  return <button onClick={inc}>Count: {count}</button>;
}`,
  }}
/>
```

Rules:

- **Pin a major version** (`"^4.5.0"`, not `"latest"`). Sandpack resolves dependencies live; pinning prevents the example from breaking when upstream ships a major.
- **Minimise dependencies.** Each one adds to first-load time. If you can do it with the standard library, do.
- **Don't add devDependencies via this prop** — there's no build step the reader sees. TypeScript, eslint, etc. don't belong here.

## 5. Sizing and console

Two display props:

- **`height={480}`** (default) — height in pixels of the editor+preview pane. Increase for wider examples (`640`, `720`); decrease for small snippets (`360`).
- **`showConsole={true}`** (default) — show the bottom console pane. Set to `false` for visual-only React examples where the console is noise.

```mdx
<Playground template="react-ts" height={360} showConsole={false} files={{ ... }} />
```

## 6. Performance budget

Playgrounds load `client:load` — they run in the browser, each one spinning up its own iframe and Sandpack worker. Treat them like videos: useful but expensive.

- **One playground per step is the standard.** Two if they're contrasting (e.g. "the bug" and "the fix" side by side). Three+ is usually a sign the step should be split.
- **First load is slow** — first-time visitors wait for Sandpack's bundler. If the playground depends on packages, it's slower. Set expectations in surrounding prose: "The playground below takes a moment to boot on first load."
- **Don't nest a playground inside a tab or hint** that the reader is likely to skip; the iframe still mounts and loads.
- **Don't use `<Tabs>` as a track selector.** Track choice is global; use `<Track id="...">` for per-track playgrounds.

## 7. Example: a complete useful playground

```mdx
<Playground
  template="react-ts"
  height={420}
  showConsole={false}
  files={{
    "/App.tsx": `import { useState } from "react";

export default function App() {
  const [name, setName] = useState("world");
  return (
    <div>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      <h1>Hello, {name}!</h1>
    </div>
  );
}`,
    "/styles.css": { code: `body { font-family: system-ui; padding: 2rem; }`, hidden: true },
  }}
/>
```

Notes on this example: small file count, runnable on first paint, the styles file is hidden because it's not the lesson, console is off because there's nothing to print.

## Don't

- Don't add a playground for non-JS code. Use `<Terminal>` for command output, fenced blocks for display-only code.
- Don't ship a playground that doesn't compile on first load. Test locally first.
- Don't put more than one or two playgrounds in a single step. Each one is a fresh iframe.
- Don't pin `"latest"` for `dependencies` — pin a major.
- Don't include `devDependencies` in `dependencies` — there's no build step.
- Don't write giant playgrounds (>~50 lines across all files). Either trim or split into two examples.
- Don't `import` Playground — it's globally registered.
- Don't use a playground when a fenced code block would do. Playgrounds are heavy.
