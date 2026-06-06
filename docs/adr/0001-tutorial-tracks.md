# Tutorial tracks: programming-language variants within one tutorial

A single tutorial can declare multiple **tracks** (programming-language variants, e.g. Python vs TypeScript) so that snippets, `verify` checks, and the `starter` resolve per track instead of authors duplicating the whole tutorial. We chose "track" over "lang" because `lang` already means fence-level syntax (Shiki) and the AI code-block filter; conflating them would mislead both readers and the AI tools.

Per-track `verify`/`starter` use a shared-or-map shape: a single spec applies to all tracks, or a map keyed by track id. When the map form is used it must cover every declared track (build error otherwise) so a learner on one track can never silently run another track's checks. Inline `<Track>` content blocks may target a subset of tracks.
