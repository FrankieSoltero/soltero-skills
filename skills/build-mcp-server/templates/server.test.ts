// Unit + in-memory integration tests. Run with: npx vitest run
// The integration test connects a real MCP Client to the server over an in-memory transport —
// it proves registration + the wire shapes, not just the helper logic.
import { describe, it, expect } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { buildServer } from "./server.js";

async function connectedClient() {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "test", version: "1.0.0" });
  const server = buildServer();
  await Promise.all([client.connect(clientTransport), server.connect(serverTransport)]);
  return { client, server };
}

describe("item-store server", () => {
  it("lists the search tool and the item resources", async () => {
    const { client, server } = await connectedClient();
    const tools = await client.listTools();
    expect(tools.tools.map((t) => t.name)).toContain("search_items");
    const resources = await client.listResources();
    expect(resources.resources.map((r) => r.uri)).toContain("items://all");
    await server.close();
  });

  it("search_items returns matches", async () => {
    const { client, server } = await connectedClient();
    const res = await client.callTool({ name: "search_items", arguments: { query: "widget" } });
    const text = (res.content as { type: string; text: string }[])[0].text;
    expect(JSON.parse(text)).toHaveLength(1);
    expect(res.isError).toBeFalsy();
    await server.close();
  });

  it("reads the items resource", async () => {
    const { client, server } = await connectedClient();
    const res = await client.readResource({ uri: "items://all" });
    expect(JSON.parse(res.contents[0].text as string)).toHaveLength(2);
    await server.close();
  });
});
