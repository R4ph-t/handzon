import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/server.ts"],
  format: ["esm"],
  target: "node22",
  outDir: "dist",
  clean: true,
  bundle: true,
  splitting: false,
  sourcemap: true,
  minify: false,
  // Mastra + AI SDK ship native ESM but pull in a long tail of CJS deps.
  // Marking them external keeps the bundle small and avoids interop
  // surprises; node_modules lives next to the bundle in the Docker layer.
  external: [
    "@mastra/core",
    "@mastra/memory",
    "@ai-sdk/anthropic",
    "@ai-sdk/openai",
    "@ai-sdk/google",
    "@ai-sdk/openai-compatible",
    "@hono/node-server",
    "hono",
    "zod",
  ],
});
