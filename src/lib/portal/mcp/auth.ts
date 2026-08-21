import { createHash, timingSafeEqual } from "node:crypto";

import { mcpConfigured, mcpKey } from "../env";

/**
 * MCP authentication: one strong shared secret (`OPERAVA_MCP_KEY`),
 * presented either as `Authorization: Bearer <key>` or embedded in the URL
 * path (`/api/mcp/<key>`) for clients that cannot send headers — the same
 * pattern Zapier's MCP uses for ChatGPT connectors.
 *
 * The key authenticates *Operava-side automation* (ChatGPT acting for Alex,
 * future agents). It is privileged access, equivalent to staff.
 */

function constantTimeEquals(a: string, b: string): boolean {
  // Hash both sides so the comparison is fixed-length and leaks nothing about
  // either value's length.
  const digestA = createHash("sha256").update(a, "utf8").digest();
  const digestB = createHash("sha256").update(b, "utf8").digest();
  return timingSafeEqual(digestA, digestB);
}

export function extractPresentedKey(request: Request, pathSegments: string[]): string | null {
  const header = request.headers.get("authorization");
  if (header?.toLowerCase().startsWith("bearer ")) {
    const value = header.slice(7).trim();
    if (value) return value;
  }
  // /api/mcp/<key> or /api/mcp/<key>/mcp — the trailing "mcp" segment is
  // tolerated because several clients append it to whatever base URL they get.
  const [first] = pathSegments;
  if (first && first !== "mcp") return first;
  return null;
}

export function isAuthorizedMcpRequest(request: Request, pathSegments: string[]): boolean {
  if (!mcpConfigured()) return false;
  const presented = extractPresentedKey(request, pathSegments);
  if (!presented) return false;
  return constantTimeEquals(presented, mcpKey());
}
