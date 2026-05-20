import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

interface LoadOptions {
  references: string[];
  tutorialFolder: string;
  budgetChars?: number;
}

/**
 * Load reference docs at build time. Local paths resolve relative to the
 * tutorial folder; URLs are fetched. Total content is capped at
 * `budgetChars` (rough proxy for token budget).
 */
export async function loadReferences({
  references,
  tutorialFolder,
  budgetChars = 32_000,
}: LoadOptions): Promise<Array<{ source: string; content: string }>> {
  const loaded: Array<{ source: string; content: string }> = [];
  let used = 0;

  for (const ref of references) {
    if (used >= budgetChars) break;
    try {
      let content: string;
      if (/^https?:\/\//.test(ref)) {
        const res = await fetch(ref);
        if (!res.ok) continue;
        content = await res.text();
      } else {
        const path = resolve(tutorialFolder, ref);
        content = await readFile(path, "utf8");
      }
      const remaining = budgetChars - used;
      const trimmed = content.length > remaining ? `${content.slice(0, remaining)}\n…[truncated]` : content;
      loaded.push({ source: ref, content: trimmed });
      used += trimmed.length;
    } catch {
      // skip unreachable refs silently
    }
  }
  return loaded;
}
