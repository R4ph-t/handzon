#!/usr/bin/env node
// Stdio MCP wrapper for clients (Claude Desktop, older editors) that
// don't speak the remote HTTP MCP transport directly. Forwards every
// JSON-RPC line from stdin to the deployed site's /api/mcp endpoint
// with the configured bearer PAT and writes the response back to
// stdout.
//
// Usage:
//   handzon-mcp --site https://learn.example.dev --token hzn_pat_…
//
// Or via env:
//   HANDZON_MCP_SITE=…  HANDZON_MCP_TOKEN=…  handzon-mcp

import { createInterface } from "node:readline";

function parseArgs(argv) {
  const out = {
    site: process.env.HANDZON_MCP_SITE ?? "",
    token: process.env.HANDZON_MCP_TOKEN ?? "",
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--site") out.site = argv[++i] ?? "";
    else if (a === "--token") out.token = argv[++i] ?? "";
    else if (a === "--help" || a === "-h") {
      process.stdout.write("Usage: handzon-mcp --site <url> --token <hzn_pat_…>\n");
      process.exit(0);
    }
  }
  return out;
}

const { site, token } = parseArgs(process.argv.slice(2));
if (!site) {
  process.stderr.write("handzon-mcp: --site is required (or set HANDZON_MCP_SITE).\n");
  process.exit(2);
}

const endpoint = new URL("/api/mcp", site).toString();
const headers = { "Content-Type": "application/json" };
if (token) headers.Authorization = `Bearer ${token}`;

// Each line on stdin is a JSON-RPC message. We don't pipeline — wait
// for the previous request's response before sending the next so the
// MCP client's request/response correlation by id stays trivial.
const rl = createInterface({ input: process.stdin });
for await (const line of rl) {
  const trimmed = line.trim();
  if (!trimmed) continue;
  try {
    const res = await fetch(endpoint, { method: "POST", headers, body: trimmed });
    const text = await res.text();
    process.stdout.write(`${text}\n`);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    let id = null;
    try {
      id = JSON.parse(trimmed).id ?? null;
    } catch {
      // unparseable input — id stays null
    }
    const errBody = JSON.stringify({
      jsonrpc: "2.0",
      id,
      error: { code: -32000, message: `handzon-mcp: ${message}` },
    });
    process.stdout.write(`${errBody}\n`);
  }
}
