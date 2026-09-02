#!/usr/bin/env node
// v2 stdio entry — verified against @modelcontextprotocol/server 2.0.0 on 2026-09-01.
// Docs: https://ts.sdk.modelcontextprotocol.io/v2/serving/stdio
//
// v2 replaces v1's `new StdioServerTransport()` + `server.connect(transport)` with
// `serveStdio(factory)`: the factory is called once per connection and the SDK owns the
// transport and the protocol-era decision. (StdioServerTransport still exists and can be
// passed via `options.transport` for a custom stream.)
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import { buildServer } from './server.js';

const handle = serveStdio(() => buildServer(), {
    onerror: err => console.error(`[mcp] transport error: ${err.message}`)
});

// STDOUT IS THE JSON-RPC STREAM. Log to stderr only — one console.log corrupts the protocol.
console.error('[mcp] my-server up (stdio)');

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    process.on(signal, () => {
        void handle.close().finally(() => process.exit(0));
    });
}
