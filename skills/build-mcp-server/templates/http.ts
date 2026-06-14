// Streamable HTTP entry — for REMOTE clients on other machines. Stateless mode.
// Auth is fail-closed bearer with a constant-time compare; secrets come from Zod-validated env.
import express, { type Request, type Response } from "express";
import crypto from "node:crypto";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  hostHeaderValidation,
  localhostHostValidation,
} from "@modelcontextprotocol/sdk/server/middleware/hostHeaderValidation.js";
import { buildServer } from "./server.js";
import { env } from "./env.js";
import { logger } from "./logger.js";

// Build the Express app by hand. Do NOT use createMcpExpressApp() here AND add your own
// express.json(): the helper already installs express.json() (with no body limit), so a second
// parser reads an already-consumed stream and every POST 500s ("stream is not readable"). Building
// it manually keeps DNS-rebinding protection AND lets you set a body-size limit.
const app = express();

// DNS-rebinding protection: validate the Host header before reading the body.
const LOCALHOST = ["127.0.0.1", "localhost", "::1"];
if (LOCALHOST.includes(env.BIND_HOST)) {
  app.use(localhostHostValidation());
} else if (env.ALLOWED_HOSTS?.length) {
  app.use(hostHeaderValidation(env.ALLOWED_HOSTS)); // required when binding 0.0.0.0 behind a proxy
} else {
  logger.warn({ host: env.BIND_HOST }, "non-localhost bind without ALLOWED_HOSTS — set it for DNS-rebinding protection");
}

app.use(express.json({ limit: "1mb" }));

function authorized(req: Request): boolean {
  const presented = (req.header("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const a = Buffer.from(presented);
  const b = Buffer.from(env.MCP_BEARER_TOKEN);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

app.get("/healthz", (_req, res) => res.json({ ok: true }));

app.post("/mcp", async (req: Request, res: Response) => {
  if (!authorized(req)) {
    res.set("WWW-Authenticate", "Bearer").status(401).json({ error: "unauthorized" });
    return;
  }
  try {
    const server = buildServer();
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    res.on("close", () => { transport.close(); server.close(); });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    logger.error({ err: (err as Error).message }, "mcp request failed");
    if (!res.headersSent) {
      res.status(500).json({ jsonrpc: "2.0", error: { code: -32603, message: "Internal server error" }, id: null });
    }
  }
});

// Stateless servers do not support GET/DELETE sessions.
const deny = (_req: Request, res: Response) =>
  res.writeHead(405).end(JSON.stringify({ jsonrpc: "2.0", error: { code: -32000, message: "Method not allowed." }, id: null }));
app.get("/mcp", deny);
app.delete("/mcp", deny);

app.listen(env.PORT, () => logger.info(`item-store http on :${env.PORT}`)); // stdout fine on HTTP
