import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import expressiveCode from "astro-expressive-code";
import rehypeMermaidPassthrough from "handzon-ui/lib/rehype-mermaid-passthrough.ts";

// Markdown-level config (shared by .md and .mdx); EC auto-extends it.

// Always run as a Node web service. Tier 1 (no Postgres) still ships every
// page; the API routes return empty stubs when DATABASE_URL is unset. This
// keeps the build simple — Astro 6 can't mix prerendered pages with
// SSR-only API routes in static output (directory/file path collisions).
export default defineConfig({
  site: process.env.SITE_URL ?? "http://localhost:4321",
  output: "server",
  adapter: (await import("@astrojs/node")).default({ mode: "standalone" }),
  server: {
    host: process.env.HOST ?? "0.0.0.0",
    port: Number(process.env.PORT ?? 4321),
  },
  integrations: [
    expressiveCode({
      themes: ["github-dark"],
      // Keep overrides minimal so the theme's token colors aren't clobbered.
      styleOverrides: {
        borderColor: "var(--color-border)",
        borderRadius: "0",
        frames: {
          shadowColor: "transparent",
          editorActiveTabBorderColor: "transparent",
          // Match our Tabs.astro look: accent at the TOP, no bottom
          // indicator. The active tab sits lifted (surface-2) over the
          // code body (surface) and attaches to it directly.
          editorActiveTabIndicatorTopColor: "var(--color-accent)",
          editorActiveTabIndicatorBottomColor: "transparent",
          editorActiveTabIndicatorHeight: "2px",
        },
      },
    }),
    mdx(),
    react(),
  ],
  vite: {
    plugins: [tailwindcss()],
    server: {
      // pnpm hoists deps into ../../node_modules/.pnpm — Vite's strict
      // fs.allow defaults to the project root and blocks those paths.
      // Walk up to the monorepo root so font + react client files load.
      fs: { allow: ["../..", "../../.."] },
    },
    resolve: {
      // Prevent duplicate React copies (pnpm symlinks can break the
      // "single React" invariant — Invalid hook call otherwise).
      dedupe: ["react", "react-dom"],
    },
    optimizeDeps: {
      // Pre-bundle deps that ChatPanel + the mermaid loader rely on,
      // so esbuild wraps their CJS-only transitives (style-to-js,
      // dayjs, …) with proper ESM interop. Without this, hydration
      // dies with "does not provide an export named 'default'".
      // Both must be top-level deps of the scaffold so Vite can
      // resolve them — handzon-ui declares them too but pnpm hides
      // transitives in .pnpm/ where Vite's project-root scan can't
      // see them.
      include: ["react-markdown", "mermaid"],
    },
  },
  markdown: {
    syntaxHighlight: false,
    rehypePlugins: [rehypeMermaidPassthrough],
  },
});
