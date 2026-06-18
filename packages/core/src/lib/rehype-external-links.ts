import type { Element, Root } from "hast";
import { visit } from "unist-util-visit";

export interface RehypeExternalLinksOptions {
  site?: string;
  target?: "_blank" | false;
  rel?: string[];
  dataAttribute?: boolean;
}

const DEFAULT_REL = ["noopener", "noreferrer"];

function getSiteOrigin(site?: string): string | undefined {
  if (!site) return undefined;

  try {
    return new URL(site).origin;
  } catch {
    return undefined;
  }
}

function getWebUrl(href: string, siteOrigin?: string): URL | undefined {
  try {
    if (href.startsWith("//")) {
      const protocol = siteOrigin ? new URL(siteOrigin).protocol : "https:";
      return new URL(`${protocol}${href}`);
    }

    return new URL(href);
  } catch {
    return undefined;
  }
}

function isExternalWebUrl(href: string, siteOrigin?: string): boolean {
  const url = getWebUrl(href, siteOrigin);
  if (!url) return false;
  if (url.protocol !== "http:" && url.protocol !== "https:") return false;
  return siteOrigin ? url.origin !== siteOrigin : true;
}

function getRelTokens(rel: unknown): string[] {
  if (Array.isArray(rel)) {
    return rel.filter((token): token is string => typeof token === "string");
  }

  if (typeof rel === "string") {
    return rel.split(/\s+/).filter(Boolean);
  }

  return [];
}

function mergeRel(existingRel: unknown, requiredRel: string[]): string[] {
  return Array.from(new Set([...getRelTokens(existingRel), ...requiredRel]));
}

export default function rehypeExternalLinks(options: RehypeExternalLinksOptions = {}) {
  const siteOrigin = getSiteOrigin(options.site);
  const target = options.target ?? "_blank";
  const rel = options.rel ?? DEFAULT_REL;

  return (tree: Root): void => {
    visit(tree, "element", (node: Element) => {
      if (node.tagName !== "a") return;

      const href = node.properties?.href;
      if (typeof href !== "string" || !isExternalWebUrl(href, siteOrigin)) return;

      node.properties ??= {};

      if (target && typeof node.properties.target !== "string") {
        node.properties.target = target;
      }

      node.properties.rel = mergeRel(node.properties.rel, rel);

      if (options.dataAttribute) {
        node.properties.dataExternal = "true";
      }
    });
  };
}
