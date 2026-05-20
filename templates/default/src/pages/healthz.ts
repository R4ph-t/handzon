import type { APIRoute } from "astro";

// Healthz returns a static JSON in Tier 1 (static), live in Tier 2 (SSR).
// Either way the response is identical, so prerendering is fine.
export const GET: APIRoute = () =>
  new Response(JSON.stringify({ status: "ok" }), {
    headers: { "Content-Type": "application/json" },
  });
