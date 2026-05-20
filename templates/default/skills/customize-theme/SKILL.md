---
name: customize-theme
description: Override theme tokens to give a tutorial site your own look.
triggers: ["customize theme", "change colors", "rebrand", "theme override"]
---

The whole theming system is a single `@theme {}` block of CSS variables. To customize:

1. Create `src/styles/themes/<my-brand>.css`.
2. Re-declare only the variables you want to change. Anything you skip falls back to the imported base.
3. In `src/styles/global.css`, swap the `@import` to point at your new file.

```css
/* src/styles/themes/my-brand.css */
@import "./brutalist-dark.css";   /* or pick another base */

@theme {
  --color-accent: oklch(70% 0.20 145);   /* green */
  --radius-md: 0.5rem;                   /* re-introduce rounded corners */
  --font-sans: "Inter Variable", system-ui;
}
```

**Don't** edit component CSS to change colors. Always go through the tokens — every component reads from them.

**Common overrides:**
- `--color-accent` — most visible single change
- `--font-sans` / `--font-mono`
- `--radius-md` to soften the brutalism
- `--shadow-raised: none` to drop the hard offset shadows
