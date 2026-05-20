import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import * as p from "@clack/prompts";
import pc from "picocolors";
import { ask } from "../shared/ask";
import { findProjectRoot } from "../shared/find-root";
import { listTutorials, pad2 } from "../shared/scan-tutorials";
import { isValidSlug, slugify } from "../shared/slugify";

interface NewOptions {
  title?: string;
  yes?: boolean;
}

export async function runNew(opts: NewOptions = {}): Promise<void> {
  const root = findProjectRoot();
  if (!root) {
    p.log.error("Not inside a Handzon project. cd into one and try again.");
    process.exit(1);
  }
  p.intro(pc.bgMagenta(pc.black(" create-handzon new ")));

  const shouldPrompt = !opts.yes;
  const title =
    opts.title ??
    (await ask(true, "", () =>
      p.text({
        message: "Tutorial title",
        placeholder: "Build a graph database",
        validate: (v) => (v.trim().length > 2 ? undefined : "Pick a longer title."),
      }),
    ));

  const suggested = slugify(title);
  const slug = await ask(shouldPrompt, suggested, () =>
    p.text({
      message: "Slug",
      defaultValue: suggested,
      placeholder: suggested,
      validate: (v) =>
        isValidSlug(v || suggested) ? undefined : "Use lowercase letters, numbers, dashes.",
    }),
  );

  const tutorials = await listTutorials(root);
  if (tutorials.some((t) => t.slug === slug)) {
    p.log.error(`A tutorial with slug "${slug}" already exists.`);
    process.exit(1);
  }
  const prefix = pad2((tutorials.at(-1)?.prefix ?? 0) + 1);

  const difficulty = await ask(shouldPrompt, "beginner" as const, () =>
    p.select({
      message: "Difficulty",
      options: [
        { value: "beginner", label: "beginner" },
        { value: "intermediate", label: "intermediate" },
        { value: "advanced", label: "advanced" },
      ],
    }),
  );

  const tagsRaw = await ask(shouldPrompt, "", () =>
    p.text({
      message: "Tags (comma-separated)",
      placeholder: "graphs, databases",
      defaultValue: "",
    }),
  );
  const tags = tagsRaw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const aiEnabled = await ask(shouldPrompt, true, () =>
    p.confirm({ message: "Enable AI helper for this tutorial?", initialValue: true }),
  );

  const folder = `${prefix}-${slug}`;
  const folderPath = join(root, "src/content/tutorials", folder);
  await mkdir(folderPath, { recursive: true });
  await mkdir(join(folderPath, "assets"), { recursive: true });

  const meta = {
    title,
    description: "TODO: one-sentence overview of what this tutorial teaches.",
    tags,
    difficulty,
    ...(aiEnabled ? {} : { ai: { enabled: false } }),
  };
  await writeFile(join(folderPath, "_meta.json"), `${JSON.stringify(meta, null, 2)}\n`, "utf8");

  const stepFrontmatter = `---\ntitle: Introduction\nduration: 5 min\nsummary: What this tutorial covers and what the learner will end up with.\n---\n`;
  const stepBody = `In this step you'll get oriented before writing any code.\n\n<Callout type="tip">\nWrite a sentence about why this tutorial exists — what the learner gets at the end.\n</Callout>\n\n<Checkpoint label="I have my environment set up." />\n\n<Recap items={["...", "..."]} />\n`;
  await writeFile(join(folderPath, "01-introduction.mdx"), stepFrontmatter + stepBody, "utf8");

  p.outro(
    pc.green("Created!") +
      `\n  src/content/tutorials/${folder}/\n  ├── _meta.json\n  ├── 01-introduction.mdx\n  └── assets/`,
  );
}
