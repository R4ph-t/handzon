import mdx from "@astrojs/mdx";
import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";

export default defineConfig({
  integrations: [
    starlight({
      title: "Handzon",
      description: "Build hands-on tutorial sites with Astro, MDX, AI assistance, and MCP.",
      favicon: "/favicon.svg",
      logo: {
        light: "./src/assets/handzon-logo-light.svg",
        dark: "./src/assets/handzon-logo-dark.svg",
      },
      editLink: {
        baseUrl: "https://github.com/R4ph-t/handzon/edit/main/sites/docs/",
      },
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/R4ph-t/handzon",
        },
      ],
      customCss: ["./src/styles/custom.css"],
      expressiveCode: {
        themes: ["github-light", "github-dark"],
        useStarlightUiThemeColors: false,
        styleOverrides: {
          borderRadius: "0.5rem",
          borderColor: "#d1d5db",
          frames: {
            shadowColor: "transparent",
            editorActiveTabIndicatorTopColor: "var(--sl-color-accent)",
            editorActiveTabIndicatorBottomColor: "transparent",
            editorActiveTabIndicatorHeight: "2px",
          },
        },
      },
      sidebar: [
        {
          label: "Start Here",
          items: [
            { label: "Overview", slug: "" },
            { label: "Install Handzon", slug: "getting-started/installation" },
            { label: "Project Structure", slug: "getting-started/project-structure" },
          ],
        },
        {
          label: "Content Model",
          items: [
            { label: "Tutorials and Steps", slug: "content/tutorials" },
            { label: "_meta.json Reference", slug: "content/meta-json" },
            { label: "Step Frontmatter", slug: "content/step-frontmatter" },
          ],
        },
        {
          label: "Guides",
          items: [
            { label: "Multi-Language Tracks", slug: "guides/tracks" },
            { label: "Covers and Media", slug: "guides/covers-and-media" },
            { label: "Checkpoints and Gating", slug: "guides/checkpoints-and-gating" },
            { label: "Verify Specs and MCP", slug: "guides/verify-and-mcp" },
            { label: "AI Tutor", slug: "guides/ai-tutor" },
            { label: "Theming", slug: "guides/theming" },
          ],
        },
        {
          label: "Reference",
          items: [
            { label: "Components", slug: "components/overview" },
            { label: "Code Fences", slug: "reference/code-fences" },
          ],
        },
        {
          label: "Deploy",
          items: [{ label: "Render", slug: "deploy/render" }],
        },
      ],
    }),
    mdx(),
  ],
});
