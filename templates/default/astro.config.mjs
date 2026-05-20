import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import expressiveCode from "astro-expressive-code";
import tailwindcss from "@tailwindcss/vite";
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
  },
  markdown: {
    syntaxHighlight: false,
  },
});
