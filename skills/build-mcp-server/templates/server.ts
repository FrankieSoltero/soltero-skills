// Shared server definition — built once, exposed over BOTH transports (stdio.ts, http.ts).
// Verified against @modelcontextprotocol/sdk v1.29.0 on 2026-06-14 — re-verify against the
// version you installed (see the skill's Rule 0). Neutral example: an in-memory item store.
// Replace the store with your real data source (DB, API, etc.).
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { logger } from "./logger.js";

type Item = { id: string; name: string; tags: string[] };
const store = new Map<string, Item>([
  ["1", { id: "1", name: "Widget", tags: ["demo"] }],
  ["2", { id: "2", name: "Gadget", tags: ["demo", "featured"] }],
]);

export function buildServer(): McpServer {
  const server = new McpServer({ name: "item-store", version: "1.0.0" });

  // RESOURCE — read-only catalog the model can read (no side effects, cacheable).
  server.registerResource(
    "items",
    "items://all",
    { title: "All items", mimeType: "application/json" },
    async (uri) => ({
      contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify([...store.values()]) }],
    }),
  );

  // DYNAMIC RESOURCE — one item by id via a templated URI.
  server.registerResource(
    "item",
    new ResourceTemplate("items://item/{id}", { list: undefined }),
    { title: "Item", mimeType: "application/json" },
    async (uri, { id }) => {
      const item = store.get(String(id));
      if (!item) throw new Error(`Unknown item: ${id}`);
      return { contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify(item) }] };
    },
  );

  // TOOL — an action with validated input and typed error handling.
  // v1.29.x: inputSchema is a RAW SHAPE ({ field: z.… }), NOT z.object(...).
  server.registerTool(
    "search_items",
    {
      title: "Search items",
      description: "Find items whose name contains the query (case-insensitive).",
      inputSchema: { query: z.string().min(1).max(100).describe("substring to match on name") },
    },
    async ({ query }) => {
      try {
        const q = query.toLowerCase();
        const hits = [...store.values()].filter((i) => i.name.toLowerCase().includes(q));
        logger.info({ tool: "search_items", count: hits.length }, "search ok"); // stderr
        return { content: [{ type: "text", text: JSON.stringify(hits) }] };
      } catch (err) {
        logger.error({ tool: "search_items", err: (err as Error).message }, "search failed");
        // Return the failure to the model; never throw into the transport.
        return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }], isError: true };
      }
    },
  );

  return server;
}
