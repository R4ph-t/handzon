import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import expressiveCode from "astro-expressive-code";
import auth from "auth-astro";
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
    // GitHub sign-in via auth-astro (Tier 2 only). Reads
    // `auth.config.ts` at the project root; mounts handlers under
    // `/api/auth/[...auth]`. The CLI strips this integration when
    // GitHub auth is disabled during scaffolding.
    auth(),
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
      // Pre-bundle react-markdown so esbuild wraps its CJS-only
      // transitive deps (style-to-js → "does not provide an export
      // named 'default'") with proper ESM interop. Without this the
      // chat panel fails to hydrate on a fresh `pnpm install` —
      // workspace dev hides it because the Vite cache from earlier
      // runs already has the wrapped version.
      include: ["react-markdown"],
    },
  },
  markdown: {
    syntaxHighlight: false,
    rehypePlugins: [rehypeMermaidPassthrough],
  },
});
