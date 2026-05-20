import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { stream } from "hono/streaming";
import { z } from "zod";
import { createAssistant } from "./agent";
import type { ProviderName } from "./providers";
import type { AssistantPayload } from "./tools";

const PORT = Number(process.env.PORT ?? 4111);
const HOST = process.env.HOST ?? "0.0.0.0";

const app = new Hono();

app.use(
  "*",
  cors({
    origin: process.env.ALLOWED_ORIGIN?.split(",") ?? ["*"],
    allowHeaders: ["Content-Type", "X-Llm-Api-Key"],
    allowMethods: ["GET", "POST", "OPTIONS"],
  }),
);

app.get("/healthz", (c) => c.json({ status: "ok" }));

const ChatBodySchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant", "system"]),
      content: z.string(),
    }),
  ),
  config: z.object({
    provider: z.enum(["anthropic", "openai", "google", "openai-compatible"]),
    model: z.string(),
    name: z.string().optional(),
    tone: z.enum(["socratic", "direct", "encouraging"]).optional(),
    persona: z.string().optional(),
    customSystemPrompt: z.string().optional(),
    disabledSkills: z.array(z.string()).optional(),
  }),
  payload: z.any(),
});

app.post("/chat", async (c) => {
  const body = await c.req.json();
  const parsed = ChatBodySchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.format() }, 400);

  const learnerKey = c.req.header("x-llm-api-key");
  const { messages, config, payload } = parsed.data;

  const agent = createAssistant({
    payload: payload as AssistantPayload,
    config: { ...config, provider: config.provider as ProviderName },
    learnerKey,
  });

  // Mastra Agent#stream returns a Vercel-AI-SDK-compatible streamable.
  const result = await agent.stream(messages);

  return stream(c, async (s) => {
    for await (const chunk of result.textStream) {
      await s.write(chunk);
    }
  });
});

serve({ fetch: app.fetch, port: PORT, hostname: HOST }, (info) => {
  console.log(`tutorial-ai-service listening on http://${info.address}:${info.port}`);
});
