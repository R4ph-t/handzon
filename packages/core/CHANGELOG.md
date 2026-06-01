# handzon-core

## 0.10.0

### Minor Changes

- Base-path awareness. A new `withBase()` helper (`handzon-core/lib/base.ts`) prefixes every hand-written internal link, asset URL, and same-origin `/api/...` call (progress sync, tutorial stats, AI help inbox, auth session/csrf, and sign-in/out form posts) with `import.meta.env.BASE_URL`. Set `base` in a scaffold's `astro.config.mjs` (e.g. `base: "/tutorials"`) and the whole app — client-side fetches, navigation, and logo/favicon assets — honors the subpath.

  Backward compatible: with no `base`, `BASE_URL` is `/` and `withBase` is an identity transform, so root deploys are byte-for-byte unchanged. Absolute, protocol-relative, and `data:` asset/link values pass through untouched. See README "Serving under a subpath".
