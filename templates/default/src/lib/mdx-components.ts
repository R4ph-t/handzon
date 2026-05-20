import Callout from "~/components/mdx/Callout.astro";
import Hint from "~/components/mdx/Hint.astro";
import StepsCmp from "~/components/mdx/Steps.astro";
import StepCmp from "~/components/mdx/Step.astro";
import File from "~/components/mdx/File.astro";
import Recap from "~/components/mdx/Recap.astro";
import Embed from "~/components/mdx/Embed.astro";
import Download from "~/components/mdx/Download.astro";
import Tabs, { Tab } from "~/components/mdx/Tabs";
import FileTree from "~/components/mdx/FileTree";
import Reveal from "~/components/mdx/Reveal";
import Terminal from "~/components/mdx/Terminal";
import Mermaid from "~/components/mdx/Mermaid";
import Diff from "~/components/mdx/Diff";
import Quiz from "~/components/mdx/Quiz";
import Checkpoint from "~/components/mdx/Checkpoint";
import Playground from "~/components/mdx/Playground";

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
    Checkpoint: (props: any) => Checkpoint({ ...props, tutorial: ctx.tutorialSlug, step: ctx.stepSlug }),
    Playground,
  };
}
