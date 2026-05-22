import type { APIRoute } from "astro";
import { resolveBearerLearner } from "../auth.ts";
import type { JsonRpcRequest } from "../mcp/protocol.ts";
import { type DispatchOptions, dispatchMcp } from "../mcp/server.ts";
import { defaultTools } from "../mcp/tools.ts";

const MAX_BODY_BYTES = 64 * 1024;

/**
 * Build an Astro POST handler that mounts the MCP JSON-RPC dispatcher
 * with the given tool set. Scaffold templates re-export this from
 * `src/pages/api/mcp/index.ts` so updates land for every site
 * without a code change in the consumer.
 *
 * GET /api/mcp returns a tiny capability descriptor that some
 * clients ping before issuing JSON-RPC.
 */
export function createMcpHandler(
  opts: DispatchOptions = { tools: defaultTools, resolveAuth: resolveBearerLearner },
): {
  GET: APIRoute;
  POST: APIRoute;
} {
  const GET: APIRoute = async () =>
    new Response(
      JSON.stringify({
        ok: true,
        transport: "http+json",
        message: "POST a JSON-RPC 2.0 request to invoke MCP tools.",
      }),
      { headers: { "Content-Type": "application/json" } },
    );

  const POST: APIRoute = async ({ request }) => {
    const lengthHeader = request.headers.get("content-length");
    if (lengthHeader && Number(lengthHeader) > MAX_BODY_BYTES) {
      return jsonRpcHttp({
        jsonrpc: "2.0",
        id: null,
        error: { code: -32600, message: "Payload too large." },
      });
    }
    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) {
      return jsonRpcHttp({
        jsonrpc: "2.0",
        id: null,
        error: { code: -32600, message: "Payload too large." },
      });
    }
    let body: JsonRpcRequest;
    try {
      body = JSON.parse(raw) as JsonRpcRequest;
    } catch {
      return jsonRpcHttp({
        jsonrpc: "2.0",
        id: null,
        error: { code: -32700, message: "Parse error." },
      });
    }
    const response = await dispatchMcp(request, body, opts);
    return jsonRpcHttp(response);
  };

  return { GET, POST };
}

function jsonRpcHttp(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
  });
}
