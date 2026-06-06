# Track resolution over MCP

The local agent is a separate process from the browser, so it can't see the in-browser track selector directly. MCP tools (`start_tutorial`, `get_step`, `submit_verification`) resolve the active track by precedence: explicit `track` argument > the learner's persisted `prefs.track` (already synced server-side via the existing `kind:"pref"` path) > tutorial `defaultTrack` > first declared track.

This makes the persisted global selector "just work" across browser and agent, while still allowing an explicit override for agent-first flows and guaranteeing a deterministic fallback. The cost is that `start_tutorial`/`get_step` gain optional learner context and a cheap preference lookup.
