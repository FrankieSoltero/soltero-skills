# Build MCP Server — SDK v2 (scoped packages) Reference

**Verified 2026-09-01** against the published artifacts of `@modelcontextprotocol/server@2.0.0`,
`@modelcontextprotocol/node@2.0.0`, `@modelcontextprotocol/express@2.0.0` (installed from npm and
type-checked — see "How this file was verified" at the bottom), plus the v2 docs site. Every code
block below carries its source URL or the file it was read from. That date is this file's shelf
life: re-run Rule 0's `npm view` before trusting a signature here.

## Which family is current (as of 2026-09-01)

`npm view @modelcontextprotocol/server version dist-tags time` — run 2026-09-01:

| Package | `latest` | published |
|---|---|---|
| `@modelcontextprotocol/server` | **2.0.0** | 2026-07-27 |
| `@modelcontextprotocol/node` | **2.0.0** | 2026-07-27 |
| `@modelcontextprotocol/express` | **2.0.0** (also an `alpha: 2.0.0-alpha.4` tag) | 2026-07-27 |
| `@modelcontextprotocol/sdk` (v1 monolith) | **1.30.0** | 2026-07-27 |

Also on `latest: 2.0.0` the same day: `/client`, `/core`, `/fastify`, `/hono`, `/codemod`.

The scoped family is **out of prerelease** — `2.0.0` stable, after alphas (2026-04-01 →
2026-06-30) and betas (2026-06-30 → 2026-07-21). The v1 monolith is **not deprecated on npm** and
shipped 1.30.0 the same day as v2.0.0.

Status per the SDK's own text:

> "**v2 is the stable release line**, implementing the [2026-07-28 MCP
> spec](https://modelcontextprotocol.io/specification/2026-07-28). Migrating from v1? Start with
> the [migration guide](https://ts.sdk.modelcontextprotocol.io/v2/migration/)."
> — `@modelcontextprotocol/server@2.0.0` `README.md` (read from the installed package, 2026-09-01)

> "v2 is the stable release line, released alongside the 2026-07-28 spec. v1.x continues to
> receive bug fixes and security updates"
> — https://github.com/modelcontextprotocol/typescript-sdk (fetched 2026-09-01)

**So: new servers go on v2.** Stay on v1 only for an existing v1 codebase you are not migrating
yet — and then use `reference.md`, not this file.

## Install & project shape

Source: `@modelcontextprotocol/server@2.0.0` and `@modelcontextprotocol/express@2.0.0` READMEs
(installed packages, 2026-09-01).

```bash
# Core + stdio (stdio ships inside @modelcontextprotocol/server, subpath ./stdio):
npm i @modelcontextprotocol/server zod

# Streamable HTTP on Node, with Express:
npm i @modelcontextprotocol/node @modelcontextprotocol/express express
```

`@modelcontextprotocol/server@2.0.0` declares `zod ^4.2.0` as a **dependency** (not a peer) —
verified from the installed `package.json`. `/node` peer-deps `hono ^4.11.4` +
`@modelcontextprotocol/server ^2.0.0`; `/express` peer-deps `express ^4.18.0 || ^5.0.0` +
`@modelcontextprotocol/server ^2.0.0`.

`tsconfig.json` gotcha, quoted from the server README:

> "TypeScript ≥6.0 no longer auto-includes `@types/*` — add `"types": ["node"]` to your
> `tsconfig.json` `compilerOptions` (the published `.d.mts` references `Buffer`)."

Otherwise: `"type": "module"`, `"module"`/`"moduleResolution": "NodeNext"`, `"target": "ES2022"`,
`"strict": true`, a `bin` entry pointing at the built stdio entry, `#!/usr/bin/env node` on it.

Other adapters exist for the same job: `@modelcontextprotocol/fastify`,
`@modelcontextprotocol/hono` (both 2.0.0). For web-standard runtimes (Workers, Deno, Bun) the
`/node` README says to use `WebStandardStreamableHTTPServerTransport` from
`@modelcontextprotocol/server` directly instead of `/node`.

## The server, defined once (v2)

Imports come from the bare package `@modelcontextprotocol/server` — **no subpaths** for the server
surface. `McpServer`, `ResourceTemplate`, `createMcpHandler`, `requireBearerAuth`,
`InMemoryTransport`, `LATEST_PROTOCOL_VERSION` etc. are all on the package root export (verified
from the installed `dist/index.d.mts` export list). Only `./stdio` and the validator entry points
are separate subpaths.

`registerTool` — exact declaration, read from
`node_modules/@modelcontextprotocol/server/dist/createMcpHandler-CLhGwQTn.d.mts` (2026-09-01):

```ts
registerTool<OutputArgs extends StandardSchemaWithJSON, InputArgs extends StandardSchemaWithJSON | undefined = undefined>(
  name: string,
  config: {
    title?: string;
    description?: string;
    inputSchema?: InputArgs;
    outputSchema?: OutputArgs;
    annotations?: ToolAnnotations;
    icons?: Icon[];
    _meta?: Record<string, unknown>;
  },
  cb: ToolCallback<InputArgs>,
): RegisteredTool;

/** @deprecated Wrap with `z.object({...})` instead. Raw-shape form: `inputSchema`/`outputSchema`
 *  may be a plain `{ field: z.string() }` record; it is auto-wrapped with `z.object()`. */
registerTool<InputArgs extends ZodRawShape, OutputArgs extends ZodRawShape | StandardSchemaWithJSON | undefined = undefined>(
  name: string, config: { /* same keys */ }, cb: LegacyToolCallback<InputArgs>,
): RegisteredTool;
```

**Read that carefully: `inputSchema` is a `z.object({...})` in v2.** The v1 raw-shape form still
compiles via a second overload, but it is explicitly `@deprecated` in 2.0.0. Write the zod object.

`registerResource` — exact declaration, same file:

```ts
registerResource(name: string, uriOrTemplate: string,           config: ResourceMetadata & { cacheHint?: CacheHint }, readCallback: ReadResourceCallback):         RegisteredResource;
registerResource(name: string, uriOrTemplate: ResourceTemplate, config: ResourceMetadata & { cacheHint?: CacheHint }, readCallback: ReadResourceTemplateCallback): RegisteredResourceTemplate;
```

Callback types (same file): `ReadResourceTemplateCallback = (uri: URL, variables: Variables, ctx: ServerContext) => …`.

Putting it together — this is `templates/v2/server.ts`, which type-checks against the real
packages (see the bottom of this file):

```ts
import { McpServer, ResourceTemplate } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';

export function buildServer(): McpServer {
    const server = new McpServer({ name: 'my-server', version: '1.0.0' });

    // TOOL — inputSchema is a ZOD OBJECT in v2 (raw shape = deprecated overload).
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
                return { content: [{ type: 'text', text: `Error: ${(err as Error).message}` }], isError: true };
            }
        }
    );

    // STATIC RESOURCE — read-only context, no args.
    server.registerResource(
        'schema',
        'schema://tables',
        { title: 'Schema', mimeType: 'application/json' },
        async uri => ({ contents: [{ uri: uri.href, text: JSON.stringify(await listTables()) }] })
    );

    // TEMPLATED RESOURCE — variables arrive as the callback's 2nd argument.
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
```

`isError: true` is still how a tool reports failure — never throw into the transport. The tool/
resource *decision* (read-only context → resource; action with cost/risk → tool) is unchanged from
v1; see `SKILL.md` step 3.

The docs use `import * as z from 'zod/v4'`
(https://ts.sdk.modelcontextprotocol.io/v2/servers/tools, fetched 2026-09-01). With the installed
`zod@4.5.4` the `zod/v4` subpath resolves and type-checks.

`outputSchema` + `structuredContent`, verbatim from that docs page:

```ts
server.registerTool(
    'product-details',
    {
        description: 'Look up one product by its exact name',
        inputSchema: z.object({ name: z.string() }),
        outputSchema: z.object({ name: z.string(), price: z.number() })
    },
    async ({ name }) => {
        return { content: [{ type: 'text', text: JSON.stringify(output) }], structuredContent: output };
    }
);
```

## Transport 1 — stdio (local clients)

v2 replaces v1's `new StdioServerTransport()` + `server.connect(transport)` with a **factory**:
`serveStdio(factory, options?)` from the `@modelcontextprotocol/server/stdio` subpath. Signature,
read from the installed `dist/stdio.d.mts`:

```ts
declare function serveStdio(factory: McpServerFactory, options?: ServeStdioOptions): StdioServerHandle;
// ServeStdioOptions: { legacy?: 'serve' | 'reject'; transport?: Transport;
//                      onerror?: (error: Error) => void; maxSubscriptions?: number }
// StdioServerHandle: { close(): Promise<void> }
```

Docs example (https://ts.sdk.modelcontextprotocol.io/v2/serving/stdio, fetched 2026-09-01):

```ts
import { McpServer } from '@modelcontextprotocol/server';
import { serveStdio } from '@modelcontextprotocol/server/stdio';

const handle = serveStdio(() => {
    const server = new McpServer({ name: 'notes', version: '1.0.0' });
    // register tools, resources, etc.
    return server;
});
```

The SDK's own doc-comment on `serveStdio` explains why it is a factory: "the opening exchange
selects the era, ONE instance from the factory is pinned for the connection lifetime". The
`StdioServerTransport` class still exists and is still exported from `./stdio` — pass it via
`options.transport` for a custom stream (a Unix socket, say) rather than constructing the plain
process-stdio one yourself.

**The stdout rule is unchanged and still stdio-only.** From the same docs page: "stdout is the
JSON-RPC channel: the host parses every line of it as a protocol message." Log with
`console.error`. Over HTTP, stdout is free.

## Transport 2 — Streamable HTTP (remote clients)

Two shapes, both real in 2.0.0.

### A. Express adapter + `NodeStreamableHTTPServerTransport`

Verbatim from `@modelcontextprotocol/express@2.0.0` `README.md` (installed package, 2026-09-01):

```ts
import { createMcpExpressApp } from '@modelcontextprotocol/express';
import { NodeStreamableHTTPServerTransport } from '@modelcontextprotocol/node';
import { McpServer } from '@modelcontextprotocol/server';

const app = createMcpExpressApp();
const server = new McpServer({ name: 'my-server', version: '1.0.0' });

app.post('/mcp', async (req, res) => {
    // Stateless example: create a transport per request.
    // For stateful mode (sessions), keep a transport instance around and reuse it.
    const transport = new NodeStreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
});
```

`createMcpExpressApp(options?)` — options interface read from the installed
`@modelcontextprotocol/express/dist/index.d.mts`:

| option | meaning (from the declaration's doc comments) |
|---|---|
| `host?: string` | bind hostname, **default `'127.0.0.1'`**; localhost-class values auto-enable DNS-rebinding protection |
| `allowedHosts?: string[]` | Host allowlist — needed when binding `0.0.0.0`/`::`; IPv6 in brackets (`'[::1]'`) |
| `allowedOrigins?: string[]` | Origin allowlist; auto-enabled for localhost-class binds when omitted |
| `jsonLimit?: string` | passed to `express.json({ limit })`; **defaults to Express's `'100kb'`** |

**This kills v1's worst HTTP gotcha.** In v1, `createMcpExpressApp()` installed `express.json()`
with no limit and no way to configure it, so adding your own parser produced
`InternalServerError: stream is not readable` on every POST (see `reference.md`). In v2 you set
the limit through `jsonLimit` — still **do not add a second `express.json()`**.

`@modelcontextprotocol/express@2.0.0` also exports `requireBearerAuth(options)` (validates
`Authorization: Bearer …` via an `OAuthTokenVerifier` you supply, attaches `AuthInfo` to
`req.auth`, and answers failures with an RFC 9728 `WWW-Authenticate` challenge),
`mcpAuthMetadataRouter`, `getOAuthProtectedResourceMetadataUrl`, `hostHeaderValidation`,
`localhostHostValidation`, `originValidation`, `localhostOriginValidation` — full export list read
from the installed `dist/index.d.mts`. Use `requireBearerAuth` when you have an OAuth
authorization server; a shared-secret constant-time bearer gate (as in `templates/v2/http.ts`) is
the smaller first step.

### B. `createMcpHandler` + `toNodeHandler` (no framework)

From https://ts.sdk.modelcontextprotocol.io/v2/serving/http (fetched 2026-09-01):

```ts
import { createMcpHandler, McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';

const handler = createMcpHandler(() => {
    const server = new McpServer({ name: 'notes', version: '1.0.0' });
    server.registerTool(
        'add-note',
        { description: 'Save a note', inputSchema: z.object({ text: z.string() }) },
        async ({ text }) => ({ content: [{ type: 'text', text: `Saved: ${text}` }] })
    );
    return server;
});
```

```ts
import { toNodeHandler, localhostHostValidation, localhostOriginValidation } from '@modelcontextprotocol/node';

const nodeHandler = toNodeHandler(handler);
const validateHost = localhostHostValidation();
const validateOrigin = localhostOriginValidation();
createServer((req, res) => {
    if (!validateHost(req, res) || !validateOrigin(req, res)) return;
    void nodeHandler(req, res);
}).listen(3000, '127.0.0.1');
```

The factory receives per-request context including `authInfo`, so a per-caller server is
`createMcpHandler(({ authInfo }) => …)`; `createMcpHandler(factory, { responseMode: 'json' })`
turns streaming off (`'json'` | `'sse'`); `await handler.close()` on SIGINT. The guards "answer
rejected requests with `403` themselves and return `false`, so the handler must not touch the
request further" (`@modelcontextprotocol/node` README).

## Protocol version — what I actually observed

- `LATEST_PROTOCOL_VERSION` exported by `@modelcontextprotocol/server@2.0.0` is **`'2025-11-25'`**;
  `SUPPORTED_PROTOCOL_VERSIONS` is `['2025-11-25','2025-06-18','2025-03-26','2024-11-05','2024-10-07']`;
  `DEFAULT_NEGOTIATED_PROTOCOL_VERSION` is `'2025-03-26'` (printed from the installed package).
- A hand-written `initialize` claiming `"protocolVersion":"2026-07-28"` against the compiled
  `templates/v2/stdio.ts` was answered with `"protocolVersion":"2025-11-25"` — i.e. `serveStdio`'s
  default `legacy: 'serve'` pinned a 2025-era instance and served it.
- The 2026-07-28 revision is a distinct "modern era" in v2 (the SDK's types talk about eras,
  `DiscoverRequest`/`DiscoverResult`, `resultType` wire discrimination, tasks). **I did not
  exercise the modern-era opening, so this file does not describe it.** If you need 2026-07-28
  semantics, read https://ts.sdk.modelcontextprotocol.io/v2/ and the repo's
  `docs/migration/support-2026-07-28.md` rather than inferring from here.

## Differences vs v1 — at a glance

v1 column = `reference.md`'s verified v1.29.0 snapshot; v2 column = verified here at 2.0.0.

| | v1 monolith `@modelcontextprotocol/sdk` 1.x | v2 scoped `@modelcontextprotocol/*` 2.0.0 |
|---|---|---|
| Packages | one (`@modelcontextprotocol/sdk`) | `/server`, `/client`, `/core`, + adapters `/node`, `/express`, `/fastify`, `/hono` |
| Imports | deep subpaths: `@modelcontextprotocol/sdk/server/mcp.js` | bare package root: `@modelcontextprotocol/server` (only `./stdio` + validators are subpaths) |
| `inputSchema` | **raw shape** `{ id: z.string() }` | **`z.object({ id: z.string() })`**; raw shape survives as a `@deprecated` overload |
| Zod | peer dep, `zod/v4` namespace on zod 3.25+ | `zod ^4.2.0` as a direct **dependency**; docs import `* as z from 'zod/v4'` |
| stdio | `new StdioServerTransport()` + `await server.connect(t)` | `serveStdio(factory, opts)` from `@modelcontextprotocol/server/stdio`; class still exported for custom streams |
| HTTP transport class | `StreamableHTTPServerTransport` from `sdk/server/streamableHttp.js` | `NodeStreamableHTTPServerTransport` (`/node`), or `WebStandardStreamableHTTPServerTransport` (`/server`) for Workers/Deno/Bun |
| Framework glue | in-package Express helper | separate adapter packages; `createMcpExpressApp` lives in `@modelcontextprotocol/express` |
| Express body limit | helper's `express.json()` had no limit; adding your own → `stream is not readable` 500s | `createMcpExpressApp({ jsonLimit: '1mb' })` — still never add a second parser |
| Framework-free HTTP | hand-wire the transport | `createMcpHandler(factory)` + `toNodeHandler` |
| Bearer auth | hand-rolled middleware | `requireBearerAuth({ verifier })` + `mcpAuthMetadataRouter` in `/express` (hand-rolled still fine for a shared secret) |
| Server lifetime | usually one long-lived `McpServer` | factory-per-connection / per-request is the model (`serveStdio`, `createMcpHandler`) |
| TS setup | `@types/node` picked up automatically | TS ≥6.0: add `"types": ["node"]` or the `.d.mts`'s `Buffer` refs fail |
| Migration | — | `npx @modelcontextprotocol/codemod@latest v1-to-v2 .` (mechanical renames only) |

Migration guide: https://ts.sdk.modelcontextprotocol.io/v2/migration/ — it states the codemod
handles the SDK-surface upgrade but **cannot** automate adopting the 2026-07-28 revision
(`createMcpHandler`, multi-round-trip requests, `versionNegotiation`) or code reading wire-only
members (`resultType`, envelope keys).

## What is unchanged from v1 (don't re-derive it)

The tool-vs-resource decision, the stdout rule, `isError: true` instead of throwing, Zod-validated
env for secrets, least-privilege upstream access, the in-memory-transport integration test
(`InMemoryTransport` is exported from `@modelcontextprotocol/server` in v2), the Inspector
(`npx @modelcontextprotocol/inspector node dist/stdio.js`) and `claude mcp add` wiring, the
multi-stage non-root Dockerfile. All of that lives in `reference.md` and applies verbatim.

## How this file was verified (2026-09-01)

```
$ npm view @modelcontextprotocol/server version dist-tags time    # → 2.0.0, latest: 2.0.0
$ npm i @modelcontextprotocol/server@2.0.0 @modelcontextprotocol/node@2.0.0 \
        @modelcontextprotocol/express@2.0.0 zod express
  added 77 packages, and audited 78 packages in 1s   # zod 4.5.4, express 5.2.1
$ npx tsc --noEmit -p tsconfig.json                  # TypeScript 7.0.2
  TSC EXIT: 0
```

`tsconfig.json` used: `module`/`moduleResolution` `NodeNext`, `target` `ES2022`,
`types: ["node"]`, `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`.
The three files in `templates/v2/` are exactly what was compiled.

Beyond type-checking, the built `dist/stdio.js` was fed a JSON-RPC session on stdin and answered
`initialize`, `tools/list`, `tools/call` (`get_item`), and `resources/read`
(`schema://table/items`) correctly — so the tool and templated-resource registrations are
runtime-verified, not just type-verified.

Pages fetched (all 2026-09-01): the server/node/express `README.md` files inside the installed
packages; https://github.com/modelcontextprotocol/typescript-sdk;
https://ts.sdk.modelcontextprotocol.io/v2/servers/tools; …/v2/servers/resources;
…/v2/serving/http; …/v2/serving/stdio; …/v2/migration/.
`https://raw.githubusercontent.com/modelcontextprotocol/typescript-sdk/v2.0.0/docs/migration/upgrade-to-v2.md`
returned **404** — there is no `v2.0.0` git tag at that path, so the migration details here come
from the docs site instead, and nothing was inferred to fill the gap.
