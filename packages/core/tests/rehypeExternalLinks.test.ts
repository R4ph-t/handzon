import assert from "node:assert/strict";
import test from "node:test";
import type { Element, Root } from "hast";
import rehypeStringify from "rehype-stringify";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import rehypeExternalLinks from "../src/lib/rehype-external-links.ts";

function anchor(href: string, properties: Element["properties"] = {}): Element {
  return {
    type: "element",
    tagName: "a",
    properties: { ...properties, href },
    children: [{ type: "text", value: href }],
  };
}

function treeWith(...children: Element[]): Root {
  return {
    type: "root",
    children,
  };
}

function run(tree: Root, options: Parameters<typeof rehypeExternalLinks>[0] = {}) {
  rehypeExternalLinks(options)(tree);
  return tree.children as Element[];
}

test("adds safe new-tab attributes to off-origin http links", () => {
  const [link] = run(treeWith(anchor("https://example.com/docs")), {
    site: "https://render.com/tutorials",
  });

  assert.deepEqual(link?.properties, {
    href: "https://example.com/docs",
    target: "_blank",
    rel: ["noopener", "noreferrer"],
  });
});

test("leaves same-origin and relative links unchanged", () => {
  const links = run(
    treeWith(
      anchor("https://render.com/docs"),
      anchor("/postgres-on-render/connection-strings"),
      anchor("#checkpoint"),
      anchor("?tab=python"),
      anchor("./assets/file.zip"),
    ),
    { site: "https://render.com/tutorials" },
  );

  assert.deepEqual(
    links.map((link) => link.properties),
    [
      { href: "https://render.com/docs" },
      { href: "/postgres-on-render/connection-strings" },
      { href: "#checkpoint" },
      { href: "?tab=python" },
      { href: "./assets/file.zip" },
    ],
  );
});

test("treats protocol-relative off-origin URLs as external", () => {
  const [link] = run(treeWith(anchor("//cdn.example.com/file.js")), {
    site: "https://render.com",
  });

  assert.equal(link?.properties?.target, "_blank");
  assert.deepEqual(link?.properties?.rel, ["noopener", "noreferrer"]);
});

test("does not open mailto or tel links in a new tab", () => {
  const links = run(treeWith(anchor("mailto:hi@example.com"), anchor("tel:+15555550123")), {
    dataAttribute: true,
  });

  assert.deepEqual(
    links.map((link) => link.properties),
    [{ href: "mailto:hi@example.com" }, { href: "tel:+15555550123" }],
  );
});

test("merges rel values and preserves an explicit target", () => {
  const [link] = run(treeWith(anchor("https://example.com", { target: "_self", rel: "nofollow" })));

  assert.deepEqual(link?.properties, {
    href: "https://example.com",
    target: "_self",
    rel: ["nofollow", "noopener", "noreferrer"],
  });
});

test("can mark external links with a data attribute without forcing a target", () => {
  const [link] = run(treeWith(anchor("https://example.com")), {
    target: false,
    rel: ["noopener"],
    dataAttribute: true,
  });

  assert.deepEqual(link?.properties, {
    href: "https://example.com",
    rel: ["noopener"],
    dataExternal: "true",
  });
});

test("adds external-link attributes to rendered markdown links", async () => {
  const file = await unified()
    .use(remarkParse)
    .use(remarkRehype)
    .use(rehypeExternalLinks, { site: "https://render.com/tutorials" })
    .use(rehypeStringify)
    .process("[external](https://example.com/docs) and [internal](/postgres-on-render)");

  assert.equal(
    String(file),
    '<p><a href="https://example.com/docs" target="_blank" rel="noopener noreferrer">external</a> and <a href="/postgres-on-render">internal</a></p>',
  );
});
