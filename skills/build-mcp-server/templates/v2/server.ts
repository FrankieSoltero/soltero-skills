// v2 (scoped packages) — verified against @modelcontextprotocol/server 2.0.0 on 2026-09-01.
// Signatures: node_modules/@modelcontextprotocol/server/dist/*.d.mts (McpServer.registerTool /
// registerResource). Docs: https://ts.sdk.modelcontextprotocol.io/v2/servers/tools
//
// The server is defined ONCE here; stdio.ts and http.ts both import buildServer().
import { McpServer, ResourceTemplate } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';

// --- your domain logic (replace) -------------------------------------------
type Item = { id: string; name: string };
async function fetchItem(id: string): Promise<Item> {
    return { id, name: `item-${id}` };
}
async function listTables(): Promise<string[]> {
    return ['items'];
}
async function describeTable(name: string): Promise<Record<string, string>> {
    return { table: name, columns: 'id, name' };
}
// ---------------------------------------------------------------------------

export function buildServer(): McpServer {
    const server = new McpServer({ name: 'my-server', version: '1.0.0' });

    // TOOL — v2 inputSchema is a ZOD OBJECT (`z.object({...})`), not a raw shape.
    // The raw-shape overload still type-checks but is marked @deprecated in 2.0.0.
    server.registerTool(
        'get_item',
        {
            title: 'Get Item',
            description: 'Fetch one item by id.',
            inputSchema: z.object({ id: z.string().min(1).describe('item id') })
        },
        async ({ id }) => {
            try {
                const item = await fetchItem(id);
                return { content: [{ type: 'text', text: JSON.stringify(item) }] };
            } catch (err) {
                // Report failure to the model; never throw into the transport.
                return { content: [{ type: 'text', text: `Error: ${(err as Error).message}` }], isError: true };
            }
        }
    );

    // STATIC RESOURCE — read-only context, no args.
    server.registerResource(
        'schema',
        'schema://tables',
        { title: 'Schema', description: 'Tables exposed by this server', mimeType: 'application/json' },
        async uri => ({ contents: [{ uri: uri.href, text: JSON.stringify(await listTables()) }] })
    );

    // TEMPLATED RESOURCE — URI variables arrive as the callback's 2nd argument.
    server.registerResource(
        'table',
        new ResourceTemplate('schema://table/{name}', { list: undefined }),
        { title: 'Table schema', mimeType: 'application/json' },
        async (uri, { name }) => ({
            contents: [{ uri: uri.href, mimeType: 'application/json', text: JSON.stringify(await describeTable(String(name))) }]
        })
    );

    return server;
}
