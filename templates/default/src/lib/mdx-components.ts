import type { ComponentProps } from "react";
import Callout from "~/components/mdx/Callout.astro";
import Checkpoint from "~/components/mdx/Checkpoint";
import Diff from "~/components/mdx/Diff";
import Download from "~/components/mdx/Download.astro";
import Embed from "~/components/mdx/Embed.astro";
import File from "~/components/mdx/File.astro";
import FileTree from "~/components/mdx/FileTree";
import Hint from "~/components/mdx/Hint.astro";
import Mermaid from "~/components/mdx/Mermaid";
import Playground from "~/components/mdx/Playground";
import Quiz from "~/components/mdx/Quiz";
import Recap from "~/components/mdx/Recap.astro";
import Reveal from "~/components/mdx/Reveal";
import StepCmp from "~/components/mdx/Step.astro";
import StepsCmp from "~/components/mdx/Steps.astro";
import Tabs, { Tab } from "~/components/mdx/Tabs";
import Terminal from "~/components/mdx/Terminal";

interface CheckpointContext {
  tutorialSlug: string;
  stepSlug: string;
}

/**
 * Returns the components mapping passed to <Content components={...} />.
 * Wraps Checkpoint so it knows which step it lives in.
 */
export function mdxComponents(ctx: CheckpointContext) {
  return {
    Callout,
    Hint,
    Steps: StepsCmp,
    Step: StepCmp,
    File,
    Recap,
    Embed,
    Download,
    Tabs,
    Tab,
    FileTree,
    Reveal,
    Terminal,
    Mermaid,
    Diff,
    Quiz,
    Checkpoint: (props: ComponentProps<typeof Checkpoint>) =>
      Checkpoint({ ...props, tutorial: ctx.tutorialSlug, step: ctx.stepSlug }),
    Playground,
  };
}
