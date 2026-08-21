/**
 * The Operava MCP endpoint: stateless MCP over Streamable HTTP.
 *
 *   POST https://<host>/api/mcp          Authorization: Bearer <OPERAVA_MCP_KEY>
 *   POST https://<host>/api/mcp/<key>    for clients that cannot send headers
 *                                        (ChatGPT custom connectors)
 *
 * A fresh server + transport pair is built per request, so this runs on
 * serverless with no shared state; responses are plain JSON.
 */

import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";

import { mcpConfigured } from "@/lib/portal/env";
import { isAuthorizedMcpRequest } from "@/lib/portal/mcp/auth";
import { buildMcpServer } from "@/lib/portal/mcp/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type RouteContext = { params: Promise<{ key?: string[] }> };

function rpcError(status: number, code: number, message: string): Response {
  return Response.json({ jsonrpc: "2.0", error: { code, message }, id: null }, { status });
}

async function authorize(request: Request, context: RouteContext): Promise<Response | null> {
  if (!mcpConfigured()) {
    return rpcError(503, -32000, "Operava MCP is not configured on this deployment.");
  }
  const { key } = await context.params;
  if (!isAuthorizedMcpRequest(request, key ?? [])) {
    return rpcError(401, -32001, "Unauthorized.");
  }
  return null;
}

export async function POST(request: Request, context: RouteContext) {
  const denied = await authorize(request, context);
  if (denied) return denied;

  const server = buildMcpServer();
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless
    enableJsonResponse: true,
  });

  try {
    await server.connect(transport);
    return await transport.handleRequest(request);
  } catch (error) {
    console.error("portal.mcp.transport_error", error);
    return rpcError(500, -32603, "Internal error.");
  } finally {
    // Fire-and-forget: the response is already materialised.
    void transport.close().catch(() => {});
    void server.close().catch(() => {});
  }
}

export async function GET(request: Request, context: RouteContext) {
  const denied = await authorize(request, context);
  if (denied) return denied;
  // Stateless servers keep no SSE stream to resume.
  return rpcError(405, -32000, "Method not allowed: POST JSON-RPC messages to this endpoint.");
}

export async function DELETE(request: Request, context: RouteContext) {
  const denied = await authorize(request, context);
  if (denied) return denied;
  return rpcError(405, -32000, "Method not allowed: stateless server, no session to delete.");
}
