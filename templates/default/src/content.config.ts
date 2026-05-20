import { defineCollection, z } from "astro:content";
import { glob, file } from "astro/loaders";

const steps = defineCollection({
  loader: glob({
    pattern: "**/[0-9]*-*.{mdx,md}",
    base: "./src/content/tutorials",
  }),
  schema: z.object({
    title: z.string(),
    duration: z.string().optional(),
    summary: z.string().optional(),
    ai: z.boolean().optional(),
  }),
});

const tutorials = defineCollection({
  loader: file("./src/content/tutorials/_index.json"),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      order: z.number().default(0),
      author: z
        .object({
          name: z.string(),
          url: z.string().url().optional(),
          avatar: image().optional(),
        })
        .optional(),
      publishedAt: z.coerce.date().optional(),
      updatedAt: z.coerce.date().optional(),
      tags: z.array(z.string()).default([]),
      difficulty: z.enum(["beginner", "intermediate", "advanced"]).default("beginner"),
      estimatedDuration: z.string().optional(),
      prerequisites: z.array(z.string()).default([]),
      nextTutorial: z.string().optional(),
      cover: image().optional(),
      icon: z.union([z.string(), image()]).optional(),
      steps: z.array(z.string()).optional(),
      gated: z.boolean().default(false),
      showProgress: z.boolean().default(true),
      feedbackUrl: z.string().url().optional(),
      ai: z
        .object({
          enabled: z.boolean().optional(),
          name: z.string().optional(),
          tagline: z.string().optional(),
          greeting: z.string().optional(),
          avatar: image().optional(),
          persona: z.string().optional(),
          tone: z.enum(["socratic", "direct", "encouraging"]).optional(),
          provider: z.string().optional(),
          model: z.string().optional(),
          byok: z.enum(["required", "optional", "disabled"]).optional(),
          systemPrompt: z.string().optional(),
          references: z.array(z.string()).default([]),
          allowedDomains: z.array(z.string()).default([]),
          disabledSkills: z.array(z.string()).default([]),
          enableSuggestPlaygroundEdit: z.boolean().default(false),
          includeFutureSteps: z.boolean().optional(),
        })
        .optional(),
    }),
});

export const collections = { steps, tutorials };
