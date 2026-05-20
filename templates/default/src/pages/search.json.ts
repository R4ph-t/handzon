import type { APIRoute } from "astro";
import { getStepsForTutorial, getTutorials, parseStepId } from "~/lib/content";

export const GET: APIRoute = async () => {
  const tutorials = await getTutorials();
  const entries: Array<{
    type: "tutorial" | "step";
    slug: string;
    title: string;
    description?: string;
    tags?: string[];
    haystack: string;
  }> = [];

  for (const t of tutorials) {
    entries.push({
      type: "tutorial",
      slug: t.id,
      title: t.data.title,
      description: t.data.description,
      tags: t.data.tags,
      haystack: `${t.data.title} ${t.data.description} ${t.data.tags.join(" ")}`.toLowerCase(),
    });
    const steps = await getStepsForTutorial(t.id);
    for (const step of steps) {
      const { stepSlug } = parseStepId(step.id);
      entries.push({
        type: "step",
        slug: `${t.id}/${stepSlug}`,
        title: step.data.title,
        description: step.data.summary,
        haystack: `${step.data.title} ${step.data.summary ?? ""}`.toLowerCase(),
      });
    }
  }

  return new Response(JSON.stringify(entries), {
    headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=600" },
  });
};
