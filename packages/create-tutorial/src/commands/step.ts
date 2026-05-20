import * as p from "@clack/prompts";
import pc from "picocolors";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { findProjectRoot } from "../shared/find-root";
import { listTutorials, nextStepPrefix, pad2 } from "../shared/scan-tutorials";
import { slugify, isValidSlug } from "../shared/slugify";

interface StepOptions {
  tutorial?: string;
  title?: string;
  duration?: string;
  yes?: boolean;
}

export async function runStep(opts: StepOptions = {}): Promise<void> {
  const root = findProjectRoot();
  if (!root) {
    p.log.error("Not inside a tutorial-tool project. cd into one and try again.");
    process.exit(1);
  }
  p.intro(pc.bgMagenta(pc.black(" create-tutorial step ")));

  const tutorials = await listTutorials(root);
  if (tutorials.length === 0) {
    p.log.error("No tutorials yet. Run `pnpm tutorial:new` first.");
    process.exit(1);
  }

  let targetFolder: string;
  if (opts.tutorial) {
    const match = tutorials.find((t) => t.slug === opts.tutorial || t.folder === opts.tutorial);
    if (!match) {
      p.log.error(`No tutorial with slug "${opts.tutorial}".`);
      process.exit(1);
    }
    targetFolder = match.folder;
  } else {
    targetFolder = (await p.select({
      message: "Which tutorial?",
      options: tutorials.map((t) => ({ value: t.folder, label: `${t.folder} — ${t.title}` })),
    })) as string;
    if (p.isCancel(targetFolder)) return cancel();
  }

  const title =
    opts.title ??
    ((await p.text({
      message: "Step title",
      placeholder: "Model your first node",
      validate: (v) => (v.trim().length > 2 ? undefined : "Pick a longer title."),
    })) as string);
  if (p.isCancel(title)) return cancel();

  const stepSlug = slugify(title);
  if (!isValidSlug(stepSlug)) {
    p.log.error(`Generated slug "${stepSlug}" is invalid.`);
    process.exit(1);
  }

  const duration =
    opts.duration ??
    ((await p.text({
      message: "Estimated duration",
      placeholder: "5 min",
      defaultValue: "5 min",
    })) as string);
  if (p.isCancel(duration)) return cancel();

  const folderPath = join(root, "src/content/tutorials", targetFolder);
  const prefix = pad2(await nextStepPrefix(folderPath));
  const filename = `${prefix}-${stepSlug}.mdx`;

  const body = `---
title: ${title}
duration: ${duration}
summary: TODO — one-line teaser shown in the sidebar.
---

<Callout type="tip">
Replace this with the first sentence the learner reads.
</Callout>

## What you'll do

1. ...
2. ...

<Checkpoint label="I finished this step." />

<Recap items={["...", "..."]} />
`;

  await writeFile(join(folderPath, filename), body, "utf8");
  p.outro(pc.green("Created!") + `\n  src/content/tutorials/${targetFolder}/${filename}`);
}

function cancel() {
  p.cancel("Cancelled.");
  process.exit(0);
}
