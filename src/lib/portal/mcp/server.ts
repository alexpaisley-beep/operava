import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { isPortalError, toPortalError } from "../errors";
import type { ServiceCtx } from "../services/context";
import { createServiceClient } from "../supabase/server";
import { buildTools } from "./tools";

export function mcpActorLabel(): string {
  return process.env.OPERAVA_MCP_ACTOR_LABEL?.trim() || "Operava MCP";
}

export function mcpServiceCtx(): ServiceCtx {
  return {
    db: createServiceClient(),
    actor: { kind: "mcp", label: mcpActorLabel() },
    source: "mcp",
  };
}

/**
 * Build a fresh MCP server wired to the tool registry. One instance per HTTP
 * request (stateless streamable HTTP), so nothing here may hold state.
 */
export function buildMcpServer(ctx: ServiceCtx = mcpServiceCtx()): McpServer {
  const server = new McpServer(
    { name: "operava", version: "1.0.0" },
    {
      instructions:
        "Operava's customer/project control plane. Customers ↔ projects ↔ milestones, timeline updates, " +
        "client action items, links and billing state. Reads return internal fields (internal notes, " +
        "internal-only updates) — never relay anything marked internal to a customer. Writes are audited " +
        "as MCP actions and accept an optional idempotencyKey; pass one when retrying. " +
        "Posting an update or action item with visibility 'customer' appears in the customer portal " +
        "immediately and may email the customer — write those as you would want a paying client to read them.",
    },
  );

  for (const tool of buildTools()) {
    server.registerTool(
      tool.name,
      {
        title: tool.title,
        description: tool.description,
        inputSchema: tool.inputShape,
        annotations: {
          readOnlyHint: tool.readOnly,
          destructiveHint: false,
          idempotentHint: tool.readOnly,
          openWorldHint: false,
        },
      },
      async (args: Record<string, unknown>) => {
        try {
          const payload = await tool.handler(ctx, args ?? {});
          return {
            content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }],
          };
        } catch (error) {
          const portalError = toPortalError(error);
          if (!isPortalError(error)) {
            console.error(`portal.mcp.tool_error ${tool.name}`, error);
          }
          return {
            isError: true,
            content: [
              {
                type: "text" as const,
                text: JSON.stringify(
                  {
                    error: {
                      code: portalError.code,
                      message: portalError.message,
                      ...(portalError.details ? { details: portalError.details } : {}),
                    },
                  },
                  null,
                  2,
                ),
              },
            ],
          };
        }
      },
    );
  }

  return server;
}
