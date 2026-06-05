# handzon-core

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
