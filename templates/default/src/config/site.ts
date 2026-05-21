/**
 * Site-wide config. Edit this file to rebrand your scaffold without
 * touching framework code. Every value here is plumbed through the
 * thin scaffold pages into handzon-core's layouts/components.
 */
export const site = {
  /** Browser tab title suffix and OG meta name. */
  name: "Handzon",
  /** Default meta description + footer tagline. */
  tagline: "Step-by-step tutorials for the modern web.",
  /** Homepage hero — big headline + subtitle. */
  hero: {
    title: "Handzon.",
    subtitle: "Tutorials with live code, quizzes, and an AI tutor that helps you learn.",
  },
  /** Brand assets. Paths are resolved against `public/`. */
  logo: "/logo.svg",
  favicon: "/favicon.svg",
  /** Footer "Built with …" link target. */
  repoUrl: "https://github.com/R4ph-t/handzon",
  /** Show the per-learner "Continue where you left off" rail on home. */
  showResumeRail: true,
};
