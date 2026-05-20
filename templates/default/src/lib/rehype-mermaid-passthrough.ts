import type { Root, Element, Text } from "hast";
import { visit } from "unist-util-visit";

/**
 * Rewrite <pre><code class="language-mermaid">…</code></pre> into
 * <pre class="mermaid">…</pre> so the client-side mermaid loader in
 * BaseLayout can render it. Zero build-time deps (no playwright).
 */
export default function rehypeMermaidPassthrough() {
  return (tree: Root) => {
    visit(tree, "element", (node: Element, index, parent) => {
      if (node.tagName !== "pre" || !parent || index === undefined) return;
      const code = node.children.find(
        (c): c is Element => c.type === "element" && c.tagName === "code",
      );
      if (!code) return;
      const classes = (code.properties?.className as string[] | undefined) ?? [];
      if (!classes.includes("language-mermaid")) return;
      const source = code.children
        .filter((c): c is Text => c.type === "text")
        .map((c) => c.value)
        .join("");
      (parent.children as Element[])[index] = {
        type: "element",
        tagName: "pre",
        properties: { className: ["mermaid"] },
        children: [{ type: "text", value: source }],
      };
    });
  };
}
