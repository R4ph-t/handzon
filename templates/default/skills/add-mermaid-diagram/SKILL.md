---
name: add-mermaid-diagram
description: Embed a Mermaid diagram, respecting the syntax rules.
triggers: ["mermaid", "diagram", "flowchart"]
---

The static path is a fenced `\`\`\`mermaid` block — it's rendered at build time, ships zero JS. Only use the `<Mermaid>` React island when the diagram needs to react to runtime state.

```mdx
\`\`\`mermaid
flowchart LR
  src["Source code"] --> build["Build"]
  build --> deploy["Deploy"]
\`\`\`
```

**Rules that prevent broken renders:**

1. **No spaces in node IDs.** Use `src` not `src code`. Put the visible label in brackets: `src["Source code"]`.
2. **Quote labels with parentheses or special chars.** `node["fn(x)"]` works; `node[fn(x)]` breaks.
3. **Keep arrows on one line.** Mermaid's parser is line-oriented.
4. **Test in the Mermaid live editor** before pasting — saves a build cycle.
