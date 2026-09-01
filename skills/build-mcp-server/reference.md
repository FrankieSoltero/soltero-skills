# Build MCP Server — Reference

Every code block below was verified against **`@modelcontextprotocol/sdk` v1.29.0** on
**2026-06-14**, sourced from the SDK repo at tag `v1.29.0` (`docs/server.md`,
`src/examples/server/`). MCP spec: `2025-11-25`. That date is the shelf life of this file:
**re-verify** with `npm view @modelcontextprotocol/sdk version` before trusting any signature
here, and treat anything published since as unrepresented.

## Version landscape (why Rule 0 exists)

Two package families, both published. Run Rule 0's two `npm view` commands to find out which is
current today — this table describes how they *differ*, not which one to pick:

| | Monolith `@modelcontextprotocol/sdk` | Scoped `@modelcontextprotocol/server` |
|---|---|---|
| Package(s) | one package | `@modelcontextprotocol/server`, `/node`, `/express` |
| Imports | subpaths: `@modelcontextprotocol/sdk/server/mcp.js` | scoped packages |
| `inputSchema` | **raw shape** `{ x: z.string() }` | `z.object({ x: z.string() })` |
| Zod | `zod` peer dep; SDK uses `zod/v4` (v3.25+ compatible) | `zod/v4` |

The code in the rest of this file is the monolith form. If Rule 0 puts you on the scoped family,
read that family's docs at its released tag — do not port these snippets by analogy.

## Install & project shape

```bash
npm i @modelcontextprotocol/sdk zod
npm i -D typescript @types/node tsx vitest
```

`package.json`: `"type": "module"`, `"bin": { "<name>": "./dist/stdio.js" }`,
scripts `build` (`tsc`), `dev` (`tsx watch`), `test` (`vitest run`), `typecheck` (`tsc --noEmit`).
`tsconfig.json`: `"module": "NodeNext"`, `"target": "ES2022"`, `"strict": true`,
`"noUncheckedIndexedAccess": true`, `outDir `dist`. Add `#!/usr/bin/env node` to the stdio entry.

## The server, defined once (v1.29.x)

```ts
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function buildServer() {
  const server = new McpServer({ name: "my-server", version: "1.0.0" });

  // TOOL — inputSchema is a RAW SHAPE in v1.x (NOT z.object). Return isError on failure.
  server.registerTool(
    "get_item",
    {
      title: "Get Item",
      description: "Fetch one item by id.",
      inputSchema: { id: z.string().min(1).describe("item id") }, // raw shape
    },
    async ({ id }) => {
      try {
        const item = await fetchItem(id);            // your logic
        return { content: [{ type: "text", text: JSON.stringify(item) }] };
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }], isError: true };
      }
    },
  );

  // STATIC RESOURCE — read-only context, no args.
  server.registerResource(
    "schema", "schema://tables", { title: "Schema", mimeType: "application/json" },
    async (uri) => ({ contents: [{ uri: uri.href, text: JSON.stringify(await listTables()) }] }),
  );

  // DYNAMIC RESOURCE — templated URI; params arrive in the callback.
  server.registerResource(
    "table", new ResourceTemplate("schema://table/{name}", { list: undefined }),
    { title: "Table schema", mimeType: "application/json" },
    async (uri, { name }) => ({ contents: [{ uri: uri.href, text: JSON.stringify(await describe(String(name))) }] }),
  );

  return server;
}
```

`isError: true` is how a tool reports failure to the model — never throw raw into the transport.

## Transport 1 — stdio (local clients)

```ts
#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { buildServer } from "./server.js";

const server = buildServer();
const transport = new StdioServerTransport();
await server.connect(transport);
console.error("server up (stdio)");   // STDERR ONLY — stdout is the JSON-RPC stream
```

**The stdout rule applies here and only here.** Any `console.log` corrupts the protocol. Add an
ESLint `no-console` rule allowing only `console.error` in stdio code.

## Transport 2 — Streamable HTTP (remote clients)

Stateless mode (one server per request — scales horizontally, no sticky sessions). The deprecated
HTTP+SSE transport (2024-11-05) is back-compat only; use Streamable HTTP.

> **Gotcha (verified the hard way):** `createMcpExpressApp()` already calls `express.json()`
> internally (with no body limit) and adds host validation. If you use it AND add your own
> `app.use(express.json(...))`, the second parser reads an already-consumed stream and **every POST
> returns 500 — `InternalServerError: stream is not readable`**. Either use the helper alone (and
> accept its default body limit), or build the app by hand as below to keep DNS-rebinding
> protection *and* set a body-size limit. Don't combine the two.

```ts
import express, { type Request, type Response } from "express";
import crypto from "node:crypto";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  hostHeaderValidation,
  localhostHostValidation,
} from "@modelcontextprotocol/sdk/server/middleware/hostHeaderValidation.js";
import { buildServer } from "./server.js";
import { env } from "./env.js";

const app = express();
// DNS-rebinding protection: localhost binds get it automatically; a non-localhost bind (0.0.0.0
// behind a TLS proxy) MUST pass an explicit Host allowlist.
const LOCALHOST = ["127.0.0.1", "localhost", "::1"];
if (LOCALHOST.includes(env.BIND_HOST)) app.use(localhostHostValidation());
else if (env.ALLOWED_HOSTS?.length) app.use(hostHeaderValidation(env.ALLOWED_HOSTS));
app.use(express.json({ limit: "1mb" }));

function authorized(req: Request): boolean {
  const presented = (req.header("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const a = Buffer.from(presented), b = Buffer.from(env.MCP_BEARER_TOKEN);
  return a.length === b.length && crypto.timingSafeEqual(a, b);   // constant-time, fail-closed
}

app.post("/mcp", async (req: Request, res: Response) => {
  if (!authorized(req)) { res.set("WWW-Authenticate", "Bearer").status(401).json({ error: "unauthorized" }); return; }
  const server = buildServer();
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined }); // stateless
  res.on("close", () => { transport.close(); server.close(); });
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

// Stateless servers reject GET/DELETE with 405.
const deny = (_req: Request, res: Response) =>
  res.writeHead(405).end(JSON.stringify({ jsonrpc: "2.0", error: { code: -32000, message: "Method not allowed." }, id: null }));
app.get("/mcp", deny);
app.delete("/mcp", deny);
app.get("/healthz", (_req, res) => res.json({ ok: true }));

app.listen(env.PORT, () => console.log(`http on :${env.PORT}`)); // stdout OK on HTTP transport
```

For per-user identity / revocation, Streamable HTTP supports **OAuth 2.0** — clients run the flow
automatically against a server that advertises it. Ship the bearer-token version first; add OAuth
only when compliance needs named-user attribution.

## Secrets — Zod-validated env (never hardcode)

```ts
import { z } from "zod";
const Env = z.object({
  PORT: z.coerce.number().default(8080),
  BIND_HOST: z.string().default("127.0.0.1"),
  MCP_BEARER_TOKEN: z.string().min(32, "set a 32+ char token (openssl rand -hex 32)"),
  DATABASE_URL: z.string().url().optional(),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
});
export const env = Env.parse(process.env);   // fail fast at startup with a clear message
```

## Least-privilege upstream (DB example)

Enforce read-only at the source, not by convention. Postgres: a `LOGIN` role with only
`GRANT SELECT`, plus `ALTER ROLE … SET default_transaction_read_only = on` and a `statement_timeout`.
SQLite: open with `{ readonly: true, fileMustExist: true }` and `PRAGMA query_only = ON`. The
SQL-string check in the tool is a courtesy gate; the role/timeout is the real boundary.

## Testing

- **Unit:** call the registered handler's logic directly with valid + malicious inputs; assert
  `isError` on the bad ones and shape on the good ones.
- **Integration (in-memory):** connect a `Client` to the server over the SDK's in-memory transport,
  then `listTools` / `callTool` / `readResource` and assert the wire shapes. Proves the handshake
  and registration, not just the helpers. (See `@modelcontextprotocol/sdk/inMemory.js`.)

## Wire into Claude Code + Inspector

```bash
# Inspect/debug standalone first:
npx @modelcontextprotocol/inspector node dist/stdio.js

# Local (stdio) — absolute path, env via --env:
claude mcp add --transport stdio <name> --env MY_KEY=… -- node /abs/path/dist/stdio.js

# Remote (Streamable HTTP) — bearer header:
claude mcp add --transport http <name> https://host/mcp --header "Authorization: Bearer <TOKEN>"
```

Verify with `claude mcp list` and `/mcp` inside a session. For a committed team config use a
project `.mcp.json` and reference the token via `${ENV_VAR}` — never commit a real secret. Confirm
flags with `claude mcp add --help` (CLI surface drifts).

## Docker (multi-stage, non-root)

Build stage runs `npm ci` + `tsc`; runtime stage runs `npm ci --omit=dev`, copies `dist/`, sets
`USER node`, `EXPOSE 8080`, `CMD ["node","dist/http.js"]`. Inject secrets at runtime via the
orchestrator — never bake them into the image. Add `.dockerignore` (`node_modules`, `dist`, `.env`,
`.git`). Terminate TLS at a reverse proxy; never expose the plain HTTP port publicly.
