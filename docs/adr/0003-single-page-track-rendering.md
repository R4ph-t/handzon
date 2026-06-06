# Single-page rendering for tracks

Each step stays a single prerendered page that inlines every track's `<Track>` content; the active track is shown/hidden client-side from the resolved `prefs.track`, with a pre-paint inline script to avoid a flash of the wrong track. We rejected per-track static routes (e.g. `/py/...`).

Track is a view concern over an identical step identity. Route-splitting would force threading `track` through every `getStaticPaths`, link, progress key, and the `start_tutorial`/`get_step` slug contract for marginal benefit. The accepted cost is that each page ships all tracks' markup.
