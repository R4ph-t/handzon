import type { APIRoute } from "astro";
import { json } from "../http.ts";

// Hit by Render's healthCheckPath on both tiers. Both tiers are SSR
// node services in this template, so the response is computed at runtime.
export const GET: APIRoute = () => json({ status: "ok" });
