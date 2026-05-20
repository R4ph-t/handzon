import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const FOLDER_RE = /^(\d+)-(.+)$/;
const FILE_RE = /^(\d+)-(.+)\.mdx$/;

export interface TutorialInfo {
  folder: string;
  prefix: number;
  slug: string;
  title: string;
  description: string;
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
    const m = FOLDER_RE.exec(d.name);
    if (!m) continue;
    let title = m[2];
    let description = "";
    try {
      const meta = JSON.parse(await readFile(join(dir, d.name, "_meta.json"), "utf8"));
      title = meta.title ?? title;
      description = meta.description ?? "";
    } catch {
      // _meta.json missing — surface folder slug
    }
    entries.push({ folder: d.name, prefix: Number(m[1]), slug: m[2], title, description });
  }
  return entries.sort((a, b) => a.prefix - b.prefix);
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
