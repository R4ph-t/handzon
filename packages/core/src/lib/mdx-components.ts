import Badge from "../components/mdx/Badge.astro";
import Button from "../components/mdx/Button.astro";
import Callout from "../components/mdx/Callout.astro";
import Card from "../components/mdx/Card.astro";
import CardGrid from "../components/mdx/CardGrid.astro";
import Checkpoint from "../components/mdx/Checkpoint.astro";
import Collapsible from "../components/mdx/Collapsible.astro";
import CopyPrompt from "../components/mdx/CopyPrompt.astro";
import Diff from "../components/mdx/Diff.astro";
import Download from "../components/mdx/Download.astro";
import Embed from "../components/mdx/Embed.astro";
import Figure from "../components/mdx/Figure.astro";
import File from "../components/mdx/File.astro";
import FileTree from "../components/mdx/FileTree.astro";
import HelpMe from "../components/mdx/HelpMe.astro";
import Hint from "../components/mdx/Hint.astro";
import Icon from "../components/ui/Icon.astro";
import Kbd from "../components/mdx/Kbd.astro";
import Mermaid from "../components/mdx/Mermaid.astro";
import Playground from "../components/mdx/Playground.astro";
import Quiz from "../components/mdx/Quiz.astro";
import Recap from "../components/mdx/Recap.astro";
import Reveal from "../components/mdx/Reveal.astro";
import StepCmp from "../components/mdx/Step.astro";
import StepsCmp from "../components/mdx/Steps.astro";
import Tab from "../components/mdx/Tab.astro";
import Tabs from "../components/mdx/Tabs.astro";
import Terminal from "../components/mdx/Terminal.astro";
import Track from "../components/mdx/Track.astro";

/**
 * The components map passed to <Content components={...} />. Every React
 * island has an .astro wrapper that pre-binds the hydration directive
 * (Astro's MDX render call can't apply client:* itself; the wrapper does).
 * Checkpoint reads its host route from a DOM marker, not props.
 */
export function mdxComponents() {
  return {
    Badge,
    Button,
    Callout,
    Card,
    CardGrid,
    Hint,
    Icon,
    Kbd,
    Collapsible,
    Steps: StepsCmp,
    Step: StepCmp,
    File,
    Figure,
    Recap,
    Embed,
    Download,
    Tabs,
    Tab,
    Track,
    FileTree,
    Reveal,
    Terminal,
    Mermaid,
    Diff,
    Quiz,
    Checkpoint,
    Playground,
    HelpMe,
    CopyPrompt,
  };
}
