/**
 * Prefix an app-internal path with Astro's configured base path.
 *
 * Handzon emits a lot of root-absolute URLs in hand-written markup and
 * client code (nav links, `/api/...` fetches, asset defaults). Astro
 * auto-prefixes its own framework routes and `_astro/*` assets with
 * `base`, but it can't rewrite strings we build by hand. Run every such
 * path through `withBase` so the whole app honors a base path like
 * `/tutorials` when one is set.
 *
 * For the default root deploy (`base` unset), `import.meta.env.BASE_URL`
 * is `"/"`, so this is an identity transform — output is unchanged.
 *
 * `import.meta.env.BASE_URL` is resolved by the consumer's Astro build
 * and is available in `.astro` frontmatter, `.tsx` components, and
 * inline `<script>` tags, so one helper covers every call site.
 *
 * @example
 *   withBase("/react-todo")       // "/react-todo"        (root)
 *   withBase("/react-todo")       // "/tutorials/react-todo" (base "/tutorials")
 *   withBase("/api/progress")     // base-aware fetch target
 *   withBase("https://cdn/x.svg") // unchanged (absolute)
 */
export function withBase(path: string): string {
  // Leave absolute, protocol-relative, and data/mailto/tel URLs alone so
  // CDN-hosted logos and external links aren't mangled.
  if (/^([a-z][a-z0-9+.-]*:|\/\/)/i.test(path)) return path;
  const base = import.meta.env.BASE_URL; // "/" or e.g. "/tutorials/"
  const rel = path.startsWith("/") ? path.slice(1) : path;
  return base.endsWith("/") ? base + rel : `${base}/${rel}`;
}
