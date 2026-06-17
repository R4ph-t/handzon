# handzon-core

## 0.17.5

### Patch Changes

- Add optional lucide icons to `Recap` and `Collapsible` via an `icon` prop (kebab-case icon name; `Recap` also accepts `icon="none"` to drop its default checkmark), and a new inline `<Icon name="..." />` component. Icons are server-rendered to static SVG and ship no client JS.

## 0.17.4

### Patch Changes

- `Figure` now resolves co-located `assets/` paths through `astro:assets`, so `src="./assets/x.png"` is optimized without an import (the same resolution `heroMedia` frontmatter gets). Nested `<Steps>` render as sub-steps with `1.1`-style numbering on a lighter box. Bumped the inline code background one notch for better contrast.

## 0.17.3

### Patch Changes

- Add `Collapsible` and `Figure` MDX components. `Collapsible` is a static, themeable collapsible section for optional detail. `Figure` renders a bordered image with an optional caption. Plain markdown images now get a matching border.

## 0.17.2

### Patch Changes

- Fix interactive quiz feedback. The step-completion coordinator re-triggered its own `store.set` on every store change, which dropped the quiz's submit re-render (status only appeared after reload) and could freeze the page; it now bails before writing when the step status is unchanged. Also fixed the "Try again" button, which was inert because it sat inside a disabled `<fieldset>`; answers stay locked after submit via the existing guard instead.

## 0.17.1

### Patch Changes

- Fix step completion on tutorials with tracks. Quizzes and checkpoints in shared prose (outside any `<Track>` panel) were dropped from the completion check when a track was active, so quiz-only or shared-checkpoint steps never marked complete and their sidebar check never appeared. Shared completion items now always count; track-scoped items count only for the active track.

## 0.17.0

### Minor Changes

- Make gated tutorials enforce progression across navigation surfaces. Sidebar links to locked future steps are disabled, and direct visits to locked steps redirect learners back to the earliest incomplete prerequisite step.

## 0.16.1

### Patch Changes

- Fail tutorial content loading when progress-traceable components like `<Quiz>` and `<Checkpoint>` omit explicit `id` props. This keeps learner progress stable across content edits and catches missing IDs during dev, check, and build.

## 0.16.0

### Minor Changes

- Treat quizzes as step completion items alongside checkpoints. Steps now complete only when every quiz on the step is answered correctly and every checkpoint on the step is complete, so quiz-only steps can gate progression without a redundant manual checkpoint.

## 0.15.4

### Patch Changes

- Add tutorial favorites and prioritize started tutorials on the homepage.

## 0.15.3

### Patch Changes

- Avoid showing a signed-out GitHub button before client auth state resolves.

## 0.15.2

### Patch Changes

- Reduce remaining page navigation shifts from auth hydration, sidebar title font swaps, and deferred Mermaid rendering.

## 0.15.1

### Patch Changes

- Avoid flashing stale auth controls and sidebar progress during page navigation.

## 0.15.0

### Minor Changes

- Add hosted slide deck support for inline embeds and step hero media. Authors can now render slide decks with `type="slides"` or `heroMedia.kind: slides`, including an optional `slide` start position for decks such as Google Slides.

## 0.14.1

### Patch Changes

- Improve generated tutorial card covers and clarify the MCP setup action.

## 0.14.0

### Minor Changes

- Make the signed-in MCP setup action more visible and self-explanatory.
- Add generated default covers for tutorial cards without authored cover images.
- Add tutorial publication metadata with `hidden` for unlisted tutorials and `published: false` for unpublished drafts.

## 0.13.4

### Patch Changes

- Polish tutorial landing and sidebar UI.

  Tutorial landing pages now render cover art as a full-width 16:9 hero image above the copy, and tutorial icon metadata now prefers image parsing before short text labels. The tutorial track selector is a compact full-width segmented control that uses `simple-icons` marks for common language tracks, with the same icons rendered during SSR and hydration to prevent pop-in between step page changes. The GitHub auth menu also renders a same-size SSR fallback while the client island resolves auth state, preventing the navbar button from shifting in after load.

## 0.13.3

### Patch Changes

- Polish sidebar and auth controls to avoid layout shifts.

  The tutorial track selector is now a compact full-width segmented control, reserves icon space during SSR to avoid hydration layout shift, and uses `simple-icons` marks for common language tracks with a compact fallback badge for unknown tracks. The GitHub auth menu now also renders a same-size SSR fallback while the client island resolves auth state, preventing the navbar button from shifting in after load.

## 0.13.2

### Patch Changes

- Polish the tutorial track selector with a compact full-width segmented control and real language icons.

  The selector no longer shows a separate "Track" label, reserves icon space during SSR to avoid hydration layout shift, and uses `simple-icons` brand marks for common language tracks with a compact fallback badge for unknown tracks.

## 0.13.1

### Patch Changes

- Render the tutorial track selector as a client-only React island. The selected
  track is localStorage-backed browser state, and the inline bootstrap already
  applies the active track before hydration. Avoiding server rendering prevents
  React hook/runtime mismatches from breaking the selector and keeps track
  selection persisted across tutorial navigation.

## 0.13.0

### Minor Changes

- ffb5c0d: Add first-class tutorial tracks for programming-language variants.

  Tutorial authors can now declare `tracks`, use `<Track>` blocks for track-specific content, and provide per-track `starter` and `verify` specs. The learner's selected track is persisted, used by MCP starter and verification tools, and passed into AI context so the tutor sees only active-track content. The default scaffold now documents tracks and includes a multi-track sample tutorial.

## 0.12.2

### Patch Changes

- Add an `authPrefix` option to `createAuthConfig()` so scaffolds can override the
  auth-astro route prefix without copying the Auth.js provider, adapter, session,
  and callback setup.

  By default, Handzon keeps deriving the auth prefix from Astro's `BASE_URL`, so
  base-mounted apps continue to handle auth at `/<base>/api/auth`. Deployments
  with a fronting proxy that strips the base path can now pass an explicit prefix,
  for example `createAuthConfig({ db, authPrefix: "/api/auth" })`.

## 0.12.1

### Patch Changes

- Make auth base-path aware. `createAuthConfig()` now configures auth-astro's
  prefix from Astro's `BASE_URL`, so apps mounted under `base: "/tutorials"`
  handle `/tutorials/api/auth/...` instead of falling through the auth catch-all
  without a response. This fixes GitHub OAuth callbacks for base-mounted sites
  when `AUTH_URL` includes the base path, for example
  `https://render.com/tutorials`.

## 0.12.0

### Minor Changes

- e86c625: Overridable footer. The footer is no longer a hardcoded "Built with Handzon" line:
  - The default `Footer` now accepts optional `siteUrl` and `siteCreditLabel` props (threaded from page wrappers and `BaseLayout`). When `siteUrl` is set, the footer leads with the site owner's credit — `© {year} {siteCreditLabel ?? siteName}` linked to `siteUrl` — and demotes "Built with Handzon" to a quieter secondary link on the side. Omit `siteUrl` and the footer is unchanged, so existing scaffolds keep their current footer.
  - `showFooter` is now threaded through every page wrapper (`Home`, `TutorialLanding`, `TutorialStep`, `TutorialLayout`), so a scaffold can pass `showFooter={false}` to drop the built-in footer entirely and render its own markup for full control.

## 0.11.0

### Minor Changes

- Overridable footer. The footer is no longer a hardcoded "Built with Handzon" line:
  - The default `Footer` now accepts an optional `siteUrl` (threaded from page wrappers and `BaseLayout`). When set, the footer leads with the site owner's credit — `© {year} {siteName}` linked to `siteUrl` — and demotes "Built with Handzon" to a quieter secondary link on the side. Omit `siteUrl` and the footer is unchanged, so existing scaffolds keep their current footer.
  - `showFooter` is now threaded through every page wrapper (`Home`, `TutorialLanding`, `TutorialStep`, `TutorialLayout`), so a scaffold can pass `showFooter={false}` to drop the built-in footer entirely and render its own markup for full control.

## 0.10.0

### Minor Changes

- Base-path awareness. A new `withBase()` helper (`handzon-core/lib/base.ts`) prefixes every hand-written internal link, asset URL, and same-origin `/api/...` call (progress sync, tutorial stats, AI help inbox, auth session/csrf, and sign-in/out form posts) with `import.meta.env.BASE_URL`. Set `base` in a scaffold's `astro.config.mjs` (e.g. `base: "/tutorials"`) and the whole app — client-side fetches, navigation, and logo/favicon assets — honors the subpath.

  Backward compatible: with no `base`, `BASE_URL` is `/` and `withBase` is an identity transform, so root deploys are byte-for-byte unchanged. Absolute, protocol-relative, and `data:` asset/link values pass through untouched. See README "Serving under a subpath".
