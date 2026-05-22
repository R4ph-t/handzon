import { createMcpHandler } from "handzon-core/server/handlers/mcp.ts";

/**
 * Remote MCP endpoint for this Handzon site. v1 ships catalog read
 * tools (list_tutorials, get_tutorial, get_step) — no auth required
 * beyond the public URL. Write tools and per-learner reads land
 * once the PAT resolver is wired.
 *
 * Mount point: POST /api/mcp with a JSON-RPC 2.0 request body.
 */
const { GET, POST } = createMcpHandler();

export { GET, POST };
