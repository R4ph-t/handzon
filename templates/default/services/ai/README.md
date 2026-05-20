# tutorial-ai-service

Mastra-powered AI assistant backend. Runs as a small Node + Hono server on a Render Web Service.

## Endpoints

- `GET /healthz` — `{"status":"ok"}` for Render's health check.
- `POST /chat` — body is `{ messages, config, payload }`. Streams plain text.

## Env vars

| name | use |
| ---- | --- |
| `PORT` | bound by Render |
| `HOST` | defaults to `0.0.0.0` |
| `ALLOWED_ORIGIN` | comma-separated origins for CORS |
| `ANTHROPIC_API_KEY` | fallback when no BYOK |
| `OPENAI_API_KEY` | fallback when no BYOK |
| `GOOGLE_GENERATIVE_AI_API_KEY` | fallback when no BYOK |
| `OPENAI_COMPATIBLE_API_KEY` | fallback for openai-compatible providers |
| `OPENAI_COMPATIBLE_BASE_URL` | base URL for openai-compatible providers |

Learner BYOK keys come in via the `X-Llm-Api-Key` header — they take precedence over env vars when present.

## Local dev

```bash
pnpm install
pnpm dev
```
