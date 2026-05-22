---
name: customize-theme
description: Override theme tokens to give a tutorial site your own look.
triggers: ["customize theme", "change colors", "rebrand", "theme override"]
---

The whole theming system is a single `@theme static {}` block of CSS variables. To customize:

1. Create `src/styles/themes/<my-brand>.css`.
2. Re-declare only the variables you want to change. Anything you skip falls back to the imported base.
3. In `src/styles/global.css`, swap the `@import` to point at your new file.

```css
/* src/styles/themes/my-brand.css */
@import "./brutalist-dark.css";   /* or pick another base */

@theme static {
  --color-accent: oklch(70% 0.20 145);   /* green */
  --radius-md: 0.5rem;                   /* re-introduce rounded corners */
  --font-sans: "Inter Variable", system-ui;
}
```

**Always use `@theme static {}`, not plain `@theme {}`.** Tailwind v4 tree-shakes plain `@theme` blocks: a CSS variable only gets emitted to the build if a corresponding utility class is generated for the codebase. Many Handzon tokens are read only via raw `var(--token)` inside component CSS — for example, `--font-weight-display`, `--text-display`, `--tracking-display`, `--ec-bg`, `--shadow-raised`. Without `static`, those overrides silently disappear from the output and your `var()` calls fall through to the fallback or to the cascade. `@theme static` forces every declared token to be emitted regardless of utility usage.

**Import order in `src/styles/global.css` is also load-bearing:**

```css
@import "handzon-core/styles/global.css";   /* brings in tailwindcss + base + components */
@import "./themes/<chosen>.css";            /* must come AFTER */
```

handzon-core's global.css is what pulls Tailwind in, and Tailwind emits its own namespace defaults (`--font-weight-*`, `--text-*`, `--leading-*`, `--tracking-*`). The theme has to load after that import or those defaults will silently override any colliding tokens.

**Don't** edit component CSS to change colors. Always go through the tokens — every component reads from them.

**Common overrides:**
- `--color-accent` — most visible single change
- `--font-sans` / `--font-mono` / `--font-display` — split the display family from the body family if your title font (e.g. Roobert Light) doesn't ship the same weights as your body font
- `--font-weight-display` / `--font-weight-heading` — drop these to `300`/`400` when shipping a light display font so the browser doesn't faux-bold it
- `--tracking-display` / `--text-display` — fine-tune hero tracking and size
- `--radius-md` to soften the brutalism
- `--shadow-raised: none` to drop the hard offset shadows
