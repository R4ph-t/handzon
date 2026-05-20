import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import expressiveCode from "astro-expressive-code";
import rehypeMermaidPassthrough from "./src/lib/rehype-mermaid-passthrough.ts";

const useRemoteBackend = process.env.PUBLIC_PROGRESS_BACKEND === "remote";

export default defineConfig({
  site: process.env.SITE_URL ?? "http://localhost:4321",
  output: useRemoteBackend ? "server" : "static",
  adapter: useRemoteBackend
    ? (await import("@astrojs/node")).default({ mode: "standalone" })
    : undefined,
  server: {
    host: process.env.HOST ?? "0.0.0.0",
    port: Number(process.env.PORT ?? 4321),
  },
  integrations: [
    expressiveCode({
      themes: ["github-dark"],
      styleOverrides: {
        borderColor: "var(--ec-border)",
        borderRadius: "0",
        borderWidth: "var(--border-default, 2px)",
        codeBackground: "var(--ec-bg)",
        codeFontFamily: "var(--font-mono)",
        frames: {
          shadowColor: "transparent",
          editorActiveTabBorderColor: "var(--color-accent)",
        },
      },
    }),
    mdx({
      rehypePlugins: [rehypeMermaidPassthrough],
    }),
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
  },
  markdown: {
    syntaxHighlight: false,
  },
});
