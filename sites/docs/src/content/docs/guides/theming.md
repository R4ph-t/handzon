---
title: Theming
description: Customize a Handzon site's look with theme tokens instead of editing core component CSS.
---

Handzon themes are CSS token files in `src/styles/themes/`. Switch themes by changing the import in `src/styles/global.css`.

```css
@import "handzon-core/styles/global.css";
@import "./themes/brutalist-dark.css";
```

Order matters. Import `handzon-core/styles/global.css` first, then the active theme.

## Theme tokens

Theme files use Tailwind v4 `@theme static` blocks:

```css
@theme static {
  --color-bg: oklch(0% 0 0);
  --color-fg: oklch(96% 0 0);
  --color-accent: oklch(64% 0.22 292.7);
  --font-sans: "Geist Variable", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "Geist Mono Variable", ui-monospace, monospace;
}
```

Use `@theme static`, not plain `@theme`. Tailwind tree-shakes plain `@theme` variables that are only consumed through raw `var(...)` references in component CSS.

## Available tokens

Surfaces:

- `--color-bg`
- `--color-fg`
- `--color-muted`
- `--color-border`
- `--color-surface`

Intent:

- `--color-accent`
- `--color-accent-fg`
- `--color-info`
- `--color-tip`
- `--color-warn`
- `--color-danger`
- `--color-success`

Geometry:

- `--radius-sm`
- `--radius-md`
- `--radius-lg`
- `--border-default`
- `--border-thick`

Shadow:

- `--shadow-raised`
- `--shadow-press`

Typography:

- `--font-sans`
- `--font-mono`
- `--font-display`
- `--font-weight-body`
- `--font-weight-strong`
- `--font-weight-heading`
- `--font-weight-display`
- `--tracking-display`
- `--tracking-heading`
- `--leading-heading`
- `--leading-body`
- `--text-display`
- `--text-h1`
- `--text-h2`
- `--text-h3`
- `--text-h4`
- `--text-body`

Code highlighting:

- `--ec-bg`
- `--ec-border`

## Font preloading

`BaseLayout` exposes a named `head` slot. Use it to preload critical fonts or add page-specific metadata.

```astro
---
import HomePage from "handzon-core/pages/Home.astro";
import roobertLight from "~/styles/fonts/Roobert-Light.woff2?url";
---

<HomePage {...siteProps}>
  <Fragment slot="head">
    <link rel="preload" href={roobertLight} as="font" type="font/woff2" crossorigin />
  </Fragment>
</HomePage>
```

## Rules

- Do not hardcode colors, fonts, radii, or shadows in MDX.
- Do not edit `handzon-core` component CSS to reskin a site.
- Create or edit a theme file under `src/styles/themes/`.
- Keep theme imports after the core global CSS import.
