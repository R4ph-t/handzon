import {
  fail,
  type JsonRpcRequest,
  type JsonRpcResponse,
  type McpContext,
  type McpTool,
  ok,
  PROTOCOL_VERSION,
  type ServerInfo,
} from "./protocol.ts";

const DEFAULT_INFO: ServerInfo = {
  name: "handzon-mcp",
  version: "0.1.0",
};

export interface DispatchOptions {
  /** Tools registered with the server. */
  tools: McpTool[];
  /** Identity declared to MCP clients. Overridable per-site. */
  serverInfo?: Partial<ServerInfo>;
  /**
   * Resolve the caller's learner id + scopes from the request, if any.
   * Catalog reads don't need this; protected tools do. When null is
   * returned for a tool with `requiredScope`, the call fails with
   * -32001 Unauthorized.
   */
  resolveAuth?: (request: Request) => Promise<{ learnerId: string; scopes: string[] } | null>;
}

/**
 * Dispatch one JSON-RPC request against the configured tool set.
 * Pure of HTTP — the Astro endpoint owns request parsing, response
 * serialization, and CORS. This function returns whatever the JSON-RPC
 * spec wants in the response body.
 */
export async function dispatchMcp(
  request: Request,
  body: JsonRpcRequest,
  opts: DispatchOptions,
): Promise<JsonRpcResponse> {
  const info = { ...DEFAULT_INFO, ...(opts.serverInfo ?? {}) };

  if (body.method === "initialize") {
    return ok(body.id, {
      protocolVersion: PROTOCOL_VERSION,
      capabilities: { tools: { listChanged: false } },
      serverInfo: info,
    });
  }

  if (body.method === "tools/list") {
    const tools = opts.tools.map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema,
    }));
    return ok(body.id, { tools });
  }

  if (body.method === "tools/call") {
    const params = body.params as { name?: string; arguments?: unknown } | undefined;
    const toolName = params?.name;
    if (!toolName) return fail(body.id, -32602, "Missing tool name.");
    const tool = opts.tools.find((t) => t.name === toolName);
    if (!tool) return fail(body.id, -32601, `Unknown tool: ${toolName}`);

    let learnerId: string | undefined;
    let scopes: string[] | undefined;
    if (opts.resolveAuth) {
      const resolved = await opts.resolveAuth(request);
      if (resolved) {
        learnerId = resolved.learnerId;
        scopes = resolved.scopes;
      }
    }
    if (tool.requiredScope) {
      if (!scopes || !scopes.includes(tool.requiredScope)) {
        return fail(body.id, -32001, `Missing required scope: ${tool.requiredScope}`);
      }
    }

    const ctx: McpContext = { request, learnerId, scopes };
    try {
      const result = await tool.handler(params?.arguments ?? {}, ctx);
      return ok(body.id, result);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      return fail(body.id, -32603, "Tool execution failed.", { message });
    }
  }

  return fail(body.id, -32601, `Unknown method: ${body.method}`);
}
