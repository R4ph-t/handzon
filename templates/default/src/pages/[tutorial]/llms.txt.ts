import type { APIRoute, GetStaticPaths } from "astro";
import { getStepsForTutorial, getTutorialBySlug, getTutorials, parseStepId } from "handzon-core";

export const prerender = true;

export const getStaticPaths: GetStaticPaths = async () => {
  const tutorials = await getTutorials();
  return tutorials.map((t) => ({ params: { tutorial: t.id } }));
};

/**
 * Per-tutorial llms.txt — concatenates every step's title + raw MDX
 * source into a single document an LLM can ingest in one shot.
 * Pattern mirrors Render's llms.txt convention; the entry point
 * referenced by the deploy skill that ships in this template.
 *
 * URL: /<tutorial>/llms.txt
 */
export const GET: APIRoute = async ({ params }) => {
  const slug = params.tutorial;
  if (!slug) return new Response("Not found", { status: 404 });
  const tutorial = await getTutorialBySlug(slug);
  if (!tutorial) return new Response("Not found", { status: 404 });
  const steps = await getStepsForTutorial(slug);

  const lines: string[] = [
    `# ${tutorial.data.title}`,
    "",
    tutorial.data.description,
    "",
    `Difficulty: ${tutorial.data.difficulty}`,
    `Steps: ${steps.length}`,
    "",
    "---",
    "",
  ];

  for (const step of steps) {
    const { stepSlug } = parseStepId(step.id);
    lines.push(`## ${step.data.title}`);
    lines.push("");
    lines.push(`Slug: ${stepSlug}`);
    if (step.data.duration) lines.push(`Duration: ${step.data.duration}`);
    if (step.data.summary) {
      lines.push("");
      lines.push(step.data.summary);
    }
    lines.push("");
    lines.push(step.body ?? "");
    lines.push("");
    lines.push("---");
    lines.push("");
  }

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
};
