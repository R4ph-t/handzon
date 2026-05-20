// Load the scaffold's root .env BEFORE any module that reads
// process.env. Same file the Astro site uses — single source of truth
// for local dev. Walk up from services/ai/(src|dist)/server.(ts|js)
// to the project root. dotenv silently no-ops if the file doesn't
// exist (production on Render: env comes from the platform) and never
// overrides values already set in process.env.
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../../../.env") });

import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { stream } from "hono/streaming";
import { z } from "zod";
import { createAssistant } from "./agent";
import { log } from "./log";
import type { ProviderName } from "./providers";
import type { AssistantPayload } from "./tools";

const PORT = Number(process.env.PORT ?? 4111);
const HOST = process.env.HOST ?? "0.0.0.0";

/** Hard cap on POST body. Headroom for big tutorials, not abuse. */
const MAX_BODY_BYTES = 1_000_000;
/** Per-IP requests allowed within RATE_WINDOW_MS before a 429. */
const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 60_000;

/**
 * Render's `fromService.property: host` ships us a bare private-network
 * hostname (e.g. "mysite-abc"). Browsers compare CORS against the full
 * Origin header, so expand each entry into `https://<host>.onrender.com`.
 * Pass-through values that already include a scheme so local dev (e.g.
 * `http://localhost:4321`) and custom domains keep working.
 */
function resolveAllowedOrigins(raw: string | undefined): string[] | "*" {
  if (!raw) return "*";
  const items = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (items.length === 0) return "*";
  return items.map((item) =>
    /^https?:\/\//i.test(item) ? item.replace(/\/$/, "") : `https://${item}.onrender.com`,
  );
}

const allowedOrigins = resolveAllowedOrigins(process.env.ALLOWED_ORIGIN);
const IS_DEV = process.env.NODE_ENV !== "production";
const LOCALHOST_ORIGIN_RE = /^https?:\/\/(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i;

/**
 * Origin allow-list with a dev-only relaxation: outside production,
 * any localhost port matches. The .env file pins one specific port,
 * but Astro auto-bumps (4321 → 4322 → 4323 …) when the default is
 * busy, and dotenv only loads at boot — so without this relaxation
 * the AI service would 403 on every preflight after a port bump
 * until the learner manually restarts both processes.
 */
function originAllowed(origin: string): string | null {
  if (allowedOrigins === "*") return origin || "*";
  if (!origin) return null;
  if (allowedOrigins.includes(origin)) return origin;
  if (IS_DEV && LOCALHOST_ORIGIN_RE.test(origin)) return origin;
  return null;
}

/**
 * Minimal in-memory token-bucket rate limiter, keyed by client IP. This
 * is process-local — multi-instance deploys will get RATE_LIMIT * N
 * effective throughput, which is fine for v1. Replace with Redis if you
 * scale out.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(ip: string): { ok: boolean; retryAfter?: number } {
  const now = Date.now();
  const entry = buckets.get(ip);
  if (!entry || entry.resetAt <= now) {
    buckets.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return { ok: true };
  }
  if (entry.count >= RATE_LIMIT) {
    return { ok: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }
  entry.count += 1;
  return { ok: true };
}
// Cheap GC so the map doesn't leak under long uptime.
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of buckets) {
    if (entry.resetAt <= now) buckets.delete(ip);
  }
}, RATE_WINDOW_MS).unref();

const app = new Hono();

app.use(
  "*",
  logger((msg) => log.info(msg)),
);

app.use(
  "*",
  cors({
    origin: originAllowed,
    allowHeaders: ["Content-Type", "X-Llm-Api-Key"],
    allowMethods: ["GET", "POST", "OPTIONS"],
  }),
);

app.get("/healthz", (c) => c.json({ status: "ok" }));

/**
 * Schema for the structured tutorial context the site sends with every
 * chat request. Bounded everywhere — these become tool inputs and get
 * inlined into the system prompt, so unbounded strings are an abuse
 * vector. The site already keeps payloads small; these limits are
 * generous but enforced.
 */
const TextShort = z.string().max(200);
const TextMedium = z.string().max(2_000);
const TextLong = z.string().max(100_000);
const Slug = z.string().min(1).max(128);

const PayloadSchema = z.object({
  tutorial: z.object({
    slug: Slug,
    title: TextShort,
    description: TextMedium,
    difficulty: z.string().max(32),
    tags: z.array(z.string().max(64)).max(50),
  }),
  outline: z
    .array(
      z.object({
        slug: Slug,
        title: TextShort,
        completed: z.boolean(),
        current: z.boolean(),
      }),
    )
    .max(200),
  currentStep: z.object({ slug: Slug, title: TextShort, source: TextLong }),
  priorSteps: z.array(z.object({ slug: Slug, title: TextShort, source: TextLong })).max(50),
  progress: z.object({
    completed: z.array(z.string().max(256)).max(500),
    quizzes: z.array(z.object({ id: z.string().max(128), correct: z.boolean() })).max(500),
    checkpoints: z.array(z.string().max(128)).max(500),
  }),
  references: z.array(z.object({ source: z.string().max(512), content: TextLong })).max(20),
  allowedDomains: z.array(z.string().max(255)).max(50),
});

const ChatBodySchema = z.object({
  // System messages MUST be set by the service. Accepting them from the
  // network is a prompt-injection footgun.
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(20_000),
      }),
    )
    .min(1)
    .max(200),
  config: z.object({
    provider: z.enum(["anthropic", "openai", "google", "openai-compatible"]),
    model: z.string().max(128),
    name: z.string().max(64).optional(),
    tone: z.enum(["socratic", "direct", "encouraging"]).optional(),
    persona: z.string().max(1_000).optional(),
    // customSystemPrompt is intentionally NOT accepted over the network.
    // It would let a caller replace the safety rules. If you want
    // per-tutorial overrides, do them in the tutorial _meta.json and let
    // the site bake them into `persona` instead.
    disabledSkills: z.array(z.string().max(64)).max(50).optional(),
  }),
  payload: PayloadSchema,
});

function clientIp(c: import("hono").Context): string {
  return (
    c.req.header("cf-connecting-ip") ??
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
    c.req.header("x-real-ip") ??
    "unknown"
  );
}

app.post(
  "/chat",
  bodyLimit({
    maxSize: MAX_BODY_BYTES,
    onError: (c) => c.json({ error: "Payload too large." }, 413),
  }),
  async (c) => {
    const ip = clientIp(c);
    const limit = checkRateLimit(ip);
    if (!limit.ok) {
      return c.json({ error: "Too many requests." }, 429, {
        "Retry-After": String(limit.retryAfter ?? 60),
      });
    }

    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: "Invalid JSON." }, 400);
    }

    const parsed = ChatBodySchema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.format() }, 400);

    const learnerKey = c.req.header("x-llm-api-key");
    const { messages, config, payload } = parsed.data;

    const agent = createAssistant({
      payload: payload as AssistantPayload,
      config: { ...config, provider: config.provider as ProviderName },
      learnerKey,
    });

    const result = await agent.stream(messages);

    return stream(c, async (s) => {
      for await (const chunk of result.textStream) {
        await s.write(chunk);
      }
    });
  },
);

serve({ fetch: app.fetch, port: PORT, hostname: HOST }, (info) => {
  log.info("tutorial-ai-service listening", { address: info.address, port: info.port });
});
