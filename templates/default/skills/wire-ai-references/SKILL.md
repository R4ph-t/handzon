---
name: wire-ai-references
description: Add reference docs to a tutorial's AI assistant context.
triggers: ["ai references", "wire references", "rag", "context docs"]
---

The AI assistant (Mastra) reads author-configured reference docs into the system prompt at build time.

1. Add your references to `_meta.json`:

   ```json
   {
     "ai": {
       "references": [
         "./refs/cheatsheet.md",
         "https://example.com/docs/llms.txt"
       ]
     }
   }
   ```

2. **Local paths** are resolved relative to the tutorial folder. Drop the file under the tutorial's `refs/` subdir.
3. **URLs** that look like `llms.txt` (the 2026 convention for AI-friendly summary docs) work too — they're fetched at build time and inlined.
4. **Budget.** References are included verbatim up to `aiDefaults.contextBudgetTokens`. Trim large docs; the assistant doesn't have vector search in v1.
5. To restrict the `fetchUrl` tool to specific origins (off by default), add `allowedDomains`:

   ```json
   { "ai": { "allowedDomains": ["docs.example.com"] } }
   ```
