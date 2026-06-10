import {
  siAstro,
  siDocker,
  siJavascript,
  siPostgresql,
  siPython,
  siReact,
  siRedis,
  siTypescript,
  siVite,
} from "simple-icons";

type Difficulty = "beginner" | "intermediate" | "advanced";

type DefaultCoverInput = {
  slug: string;
  title: string;
  difficulty: Difficulty;
  tags: string[];
  icon?: unknown;
};

export type DefaultCoverMeta = {
  difficulty: Difficulty;
  glow: 0 | 1 | 2 | 3;
  icon?: {
    path: string;
    title: string;
  };
  keywords: string[];
  label: string;
  pattern: "grid" | "dots";
  scale: 0 | 1 | 2;
  variant: 0 | 1 | 2 | 3;
};

const PATTERNS: DefaultCoverMeta["pattern"][] = ["grid", "dots"];

const TAG_PATTERNS: Record<string, DefaultCoverMeta["pattern"]> = {
  ai: "dots",
  api: "grid",
  auth: "grid",
  authoring: "grid",
  databases: "dots",
  deploy: "grid",
  devops: "grid",
  docker: "grid",
  frontend: "grid",
  javascript: "grid",
  meta: "grid",
  postgres: "dots",
  python: "grid",
  queues: "grid",
  react: "grid",
  redis: "dots",
  render: "grid",
  sql: "dots",
  tracks: "grid",
  typescript: "grid",
  vite: "grid",
  web: "grid",
};

const TAG_ICONS: Record<string, DefaultCoverMeta["icon"]> = {
  astro: siAstro,
  docker: siDocker,
  javascript: siJavascript,
  postgres: siPostgresql,
  python: siPython,
  react: siReact,
  redis: siRedis,
  typescript: siTypescript,
  vite: siVite,
};

const KEYWORD_STOPWORDS = new Set(["A", "AN", "AND", "APP", "BUILD", "THE", "TO", "WITH"]);

function stableIndex(value: string, modulo: number): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash % modulo;
}

function normalizeKeywords(value: string): string[] {
  return value
    .split(/[^a-z0-9]+/i)
    .map((word) => word.toUpperCase())
    .filter(Boolean);
}

function getKeywords(input: DefaultCoverInput): string[] {
  const words = [...input.tags, ...input.title.split(/\s+/)]
    .flatMap(normalizeKeywords)
    .filter((word) => word.length >= 2 && !KEYWORD_STOPWORDS.has(word));

  return Array.from(new Set(words)).slice(0, 3);
}

export function getDefaultCoverMeta(input: DefaultCoverInput): DefaultCoverMeta {
  const label = input.tags[0] ?? input.difficulty;
  const icon = input.tags.map((tag) => TAG_ICONS[tag.toLowerCase()]).find(Boolean);
  const variant = stableIndex(input.slug, 4) as DefaultCoverMeta["variant"];
  const scale = stableIndex(`${input.slug}:${label}:scale`, 3) as DefaultCoverMeta["scale"];
  const glow = stableIndex(`${input.slug}:${input.title}:glow`, 4) as DefaultCoverMeta["glow"];
  const pattern =
    input.tags.map((tag) => TAG_PATTERNS[tag.toLowerCase()]).find(Boolean) ??
    PATTERNS[stableIndex(`${input.title}:${input.tags.join(":")}`, PATTERNS.length)];

  return {
    difficulty: input.difficulty,
    glow,
    icon,
    keywords: getKeywords(input),
    label,
    pattern,
    scale,
    variant,
  };
}
