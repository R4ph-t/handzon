const PROGRESS_ITEM_COMPONENTS = ["Checkpoint", "Quiz"] as const;

type ProgressItemComponent = (typeof PROGRESS_ITEM_COMPONENTS)[number];

export type ProgressItemIds = Record<ProgressItemComponent, Set<string>>;

const emptyProgressItemIds = (): ProgressItemIds => ({
  Checkpoint: new Set<string>(),
  Quiz: new Set<string>(),
});

function stripFencedCodeBlocks(body: string): string {
  return body.replace(/^(```|~~~)[^\n]*\n[\s\S]*?^\1\s*$/gm, "");
}

function readAttribute(tag: string, attribute: string): string | undefined {
  const attrRe = new RegExp(`\\b${attribute}\\s*=\\s*(?:"([^"]+)"|'([^']+)'|\\{\`([^\`]+)\`\\})`);
  const match = attrRe.exec(tag);
  return match?.[1] ?? match?.[2] ?? match?.[3];
}

function readTag(source: string, start: number): { tag: string; end: number } | null {
  let quote: '"' | "'" | "`" | null = null;
  for (let i = start + 1; i < source.length; i++) {
    const char = source[i];
    if (quote) {
      if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'" || char === "`") {
      quote = char;
      continue;
    }
    if (char === ">") return { tag: source.slice(start, i + 1), end: i + 1 };
  }
  return null;
}

function findProgressItemTags(body: string) {
  const source = stripFencedCodeBlocks(body);
  const tags: Array<{ component: ProgressItemComponent; tag: string }> = [];
  for (let i = 0; i < source.length; i++) {
    if (source[i] !== "<" || !/[A-Za-z]/.test(source[i + 1] ?? "")) continue;
    const tag = readTag(source, i);
    if (!tag) continue;
    const match = /^<(Checkpoint|Quiz)\b/.exec(tag.tag);
    if (match) tags.push({ component: match[1] as ProgressItemComponent, tag: tag.tag });
    i = tag.end - 1;
  }
  return tags;
}

export function validateProgressItemIds({ body, entryId }: { body: string; entryId: string }) {
  for (const { component, tag } of findProgressItemTags(body)) {
    if (readAttribute(tag, "id")) continue;
    throw new Error(
      `[handzon] step ${entryId}: <${component}> must include an explicit id because it contributes to progress. Use id="<step-area>/<concept>" so learner progress survives content edits.`,
    );
  }
}

export function collectProgressItemIds(body: string): ProgressItemIds {
  const ids = emptyProgressItemIds();
  for (const { component, tag } of findProgressItemTags(body)) {
    const id = readAttribute(tag, "id");
    if (id) ids[component].add(id);
  }
  return ids;
}
