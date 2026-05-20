---
name: add-checkpoint
description: Write a verifiable checkpoint that gates progress to the next step.
triggers: ["add checkpoint", "checkpoint", "gate step"]
---

1. The checkpoint label is a **first-person, verifiable claim** the learner can confirm. Examples:
   - "My dev server is running and the browser shows the Vite welcome screen."
   - "I see two TODOs in the list."
   - "My API responds to `curl localhost:8000/healthz` with `{"status":"ok"}`."
2. Avoid vague claims: "I understand X" — there's no way to verify, so it adds friction without value.
3. Place the checkpoint **before** the Recap component, at the bottom of the step.
4. If the tutorial's `_meta.json` has `"gated": true`, the Next button will be disabled until the learner toggles this checkpoint.

```mdx
<Checkpoint label="I can curl my Flask app and see {\"status\":\"ok\"}." />

<Recap items={["...", "..."]} />
```
