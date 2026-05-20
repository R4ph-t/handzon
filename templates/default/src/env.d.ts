/// <reference path="../.astro/types.d.ts" />

interface ImportMetaEnv {
  readonly PUBLIC_PROGRESS_BACKEND?: "local" | "remote";
  readonly PUBLIC_SITE_NAME?: string;
  readonly DATABASE_URL?: string;
  readonly ANTHROPIC_API_KEY?: string;
  readonly OPENAI_API_KEY?: string;
  readonly GOOGLE_GENERATIVE_AI_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
