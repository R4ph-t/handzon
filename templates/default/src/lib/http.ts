/**
 * Shared HTTP helpers for API routes. Centralises the JSON response shape
 * and the same-origin guard so routes don't reinvent either.
 */

export function json(body: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  return new Response(JSON.stringify(body), { ...init, headers });
}

/**
 * Reject cross-origin writes. SameSite=Lax on the device cookie already
 * blocks most CSRF, but `Sec-Fetch-Site` is the modern, browser-supplied
 * check — pair them for defense in depth. Same-origin and direct
 * navigations are allowed; `none` (typed URL, bookmark) is allowed for GET
 * only, which API mutating routes don't expose.
 */
export function isSameOrigin(request: Request): boolean {
  const site = request.headers.get("sec-fetch-site");
  if (site === "same-origin") return true;
  if (site === "none") return true;
  if (site) return false;
  // Older browsers without Sec-Fetch-Site: fall back to Origin/Referer.
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const host = request.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
