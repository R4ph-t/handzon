/**
 * Minimal MCP-compatible JSON-RPC 2.0 dispatcher.
 *
 * We hand-roll the surface (rather than depending on
 * @modelcontextprotocol/sdk) because the SDK targets Node http
 * I/O, while Astro endpoints run on the Fetch Request/Response
 * API. The Streamable HTTP transport supports immediate JSON
 * responses, which is all v1 needs — SSE-streamed tool results
 * are not on the v1 menu.
 *
 * Supported methods:
 *   - initialize          → server capabilities + name/version
 *   - tools/list          → ordered tool descriptors
 *   - tools/call          → execute a tool with arguments
 *
 * Anything else returns -32601 Method not found.
 */

export const PROTOCOL_VERSION = "2025-03-26";

export interface JsonRpcRequest {
  jsonrpc: "2.0";
  id?: string | number | null;
  method: string;
  params?: unknown;
}

export interface JsonRpcResult {
  jsonrpc: "2.0";
  id: string | number | null;
  result: unknown;
}

export interface JsonRpcError {
  jsonrpc: "2.0";
  id: string | number | null;
  error: { code: number; message: string; data?: unknown };
}

export type JsonRpcResponse = JsonRpcResult | JsonRpcError;

export interface McpToolContent {
  type: "text";
  text: string;
}

export interface McpToolResult {
  content: McpToolContent[];
  isError?: boolean;
}

export interface McpTool<A = unknown> {
  name: string;
  description: string;
  /** JSON Schema for the tool arguments. */
  inputSchema: Record<string, unknown>;
  handler: (args: A, ctx: McpContext) => Promise<McpToolResult>;
  /** Set when the tool mutates state — used to gate by scope. */
  requiredScope?: string;
}

export interface McpContext {
  /** Resolved learner id when an authenticated tool is invoked. */
  learnerId?: string;
  /** Token scopes granted to the caller. */
  scopes?: string[];
  /** Original request — tools that need cookies, IP, etc. read from here. */
  request: Request;
}

export interface ServerInfo {
  name: string;
  version: string;
}

export function ok(id: JsonRpcRequest["id"], result: unknown): JsonRpcResult {
  return { jsonrpc: "2.0", id: id ?? null, result };
}

export function fail(
  id: JsonRpcRequest["id"],
  code: number,
  message: string,
  data?: unknown,
): JsonRpcError {
  return {
    jsonrpc: "2.0",
    id: id ?? null,
    error: data === undefined ? { code, message } : { code, message, data },
  };
}

export function text(value: string): McpToolResult {
  return { content: [{ type: "text", text: value }] };
}

export function errorResult(message: string): McpToolResult {
  return { content: [{ type: "text", text: message }], isError: true };
}
