import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const FILE_RE = /^(\d+)-(.+)\.mdx$/;

export interface TutorialInfo {
  folder: string;
  slug: string;
  title: string;
  description: string;
}

interface TutorialIndex {
  order: string[];
}

export async function readIndex(projectRoot: string): Promise<TutorialIndex> {
  const path = join(projectRoot, "src/content/tutorials/_index.json");
  try {
    const raw = await readFile(path, "utf8");
    const parsed = JSON.parse(raw);
    const order = Array.isArray(parsed?.order)
      ? parsed.order.filter((s: unknown): s is string => typeof s === "string")
      : [];
    return { order };
  } catch {
    return { order: [] };
  }
}

export async function listTutorials(projectRoot: string): Promise<TutorialInfo[]> {
  const dir = join(projectRoot, "src/content/tutorials");
  const entries: TutorialInfo[] = [];
  let dirents: import("node:fs").Dirent[] = [];
  try {
    dirents = await readdir(dir, { withFileTypes: true });
  } catch {
    return entries;
  }
  for (const d of dirents) {
    if (!d.isDirectory()) continue;
    let title = d.name;
    let description = "";
    let hasMeta = false;
    try {
      const meta = JSON.parse(await readFile(join(dir, d.name, "_meta.json"), "utf8"));
      hasMeta = true;
      title = meta.title ?? title;
      description = meta.description ?? "";
    } catch {
      // _meta.json missing — skip directories that aren't tutorials
    }
    if (!hasMeta) continue;
    entries.push({ folder: d.name, slug: d.name, title, description });
  }
  const { order } = await readIndex(projectRoot);
  const orderPos = new Map(order.map((slug, i) => [slug, i]));
  return entries.sort((a, b) => {
    const ai = orderPos.get(a.slug);
    const bi = orderPos.get(b.slug);
    if (ai !== undefined && bi !== undefined) return ai - bi;
    if (ai !== undefined) return -1;
    if (bi !== undefined) return 1;
    return a.slug.localeCompare(b.slug);
  });
}

export async function nextStepPrefix(tutorialFolder: string): Promise<number> {
  let max = 0;
  try {
    const files = await readdir(tutorialFolder);
    for (const f of files) {
      const m = FILE_RE.exec(f);
      if (m) max = Math.max(max, Number(m[1]));
    }
  } catch {
    // empty tutorial folder
  }
  return max + 1;
}

export function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}
