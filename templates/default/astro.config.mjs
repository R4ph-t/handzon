import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import expressiveCode from "astro-expressive-code";
import auth from "auth-astro";
import rehypeExternalLinks from "handzon-core/lib/rehype-external-links.ts";
import rehypeMermaidPassthrough from "handzon-core/lib/rehype-mermaid-passthrough.ts";

// Astro auto-loads `.env` into `import.meta.env`, but SSR/Node code
// (Auth.js, the Drizzle client, our /api routes) reads `process.env`.
// `process.loadEnvFile` (Node ≥20.12) bridges the two so AUTH_SECRET,
// DATABASE_URL, GITHUB_CLIENT_ID etc. arrive where Auth.js + drizzle
// look for them. Silent no-op if .env is absent (Tier 1 builds).
try {
  process.loadEnvFile(".env");
} catch {
  // .env missing or unreadable — that's fine for Tier 1.
}

// Markdown-level config (shared by .md and .mdx); EC auto-extends it.
const SITE = process.env.SITE_URL ?? "http://localhost:4321";

// Always run as a Node web service. Tier 1 (no Postgres) still ships every
// page; the API routes return empty stubs when DATABASE_URL is unset. This
// keeps the build simple — Astro 6 can't mix prerendered pages with
// SSR-only API routes in static output (directory/file path collisions).
export default defineConfig({
  site: SITE,
  output: "server",
  adapter: (await import("@astrojs/node")).default({ mode: "standalone" }),
  server: {
    host: process.env.HOST ?? "0.0.0.0",
    port: Number(process.env.PORT ?? 4321),
  },
  security: {
    // Render terminates TLS at the edge and forwards plain HTTP with
    // `X-Forwarded-Host` / `X-Forwarded-Proto` headers. Astro's
    // checkOrigin middleware only honours those headers when
    // `allowedDomains` is populated — otherwise it falls back to
    // `http://localhost`, which mismatches the browser's
    // `Origin: https://<your-site>.onrender.com` and 403s every
    // form POST (Auth.js sign-in, /api/progress, etc.) with
    // "Cross-site POST form submissions are forbidden". Trusting
    // any forwarded host is safe here because Render's edge is the
    // only thing that can inject these headers; the deployment
    // hostname is unknown at build time so a specific pattern
    // would be fragile.
    allowedDomains: [{}],
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
      // Pre-bundle deps that ChatPanel + the mermaid loader rely on,
      // so esbuild wraps their CJS-only transitives (style-to-js,
      // dayjs, …) with proper ESM interop. Without this, hydration
      // dies with "does not provide an export named 'default'".
      // Both must be top-level deps of the scaffold so Vite can
      // resolve them — handzon-core declares them too but pnpm hides
      // transitives in .pnpm/ where Vite's project-root scan can't
      // see them.
      include: ["react-markdown", "mermaid"],
    },
  },
  markdown: {
    syntaxHighlight: false,
    rehypePlugins: [rehypeMermaidPassthrough, [rehypeExternalLinks, { site: SITE }]],
  },
});
