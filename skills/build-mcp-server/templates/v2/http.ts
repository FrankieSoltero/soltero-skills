// v2 Streamable HTTP entry (Express) — verified against @modelcontextprotocol/server 2.0.0,
// @modelcontextprotocol/express 2.0.0, @modelcontextprotocol/node 2.0.0 on 2026-09-01.
// Sources: the two adapter READMEs (node_modules/@modelcontextprotocol/{express,node}/README.md)
// and https://ts.sdk.modelcontextprotocol.io/v2/serving/http
import crypto from 'node:crypto';
import type { Request, RequestHandler, Response } from 'express';
import { createMcpExpressApp } from '@modelcontextprotocol/express';
import { NodeStreamableHTTPServerTransport } from '@modelcontextprotocol/node';
import * as z from 'zod/v4';
import { buildServer } from './server.js';

// Secrets via validated env — never hardcoded. Fails fast at startup.
const env = z
    .object({
        PORT: z.coerce.number().default(8080),
        BIND_HOST: z.string().default('127.0.0.1'),
        ALLOWED_HOSTS: z
            .string()
            .optional()
            .transform(v => (v ? v.split(',').map(s => s.trim()) : undefined)),
        MCP_BEARER_TOKEN: z.string().min(32, 'set a 32+ char token (openssl rand -hex 32)')
    })
    .parse(process.env);

// createMcpExpressApp() installs express.json() itself (jsonLimit) plus Host/Origin
// validation for localhost-class binds. Do NOT add a second express.json() — configure it here.
const app = createMcpExpressApp({
    host: env.BIND_HOST,
    ...(env.ALLOWED_HOSTS ? { allowedHosts: env.ALLOWED_HOSTS } : {}),
    jsonLimit: '1mb'
});

// Fail-closed, constant-time bearer check. For per-user identity/revocation use
// `requireBearerAuth({ verifier })` from @modelcontextprotocol/express with a real
// OAuthTokenVerifier instead of this shared-secret gate.
const requireToken: RequestHandler = (req, res, next) => {
    const presented = Buffer.from((req.header('authorization') ?? '').replace(/^Bearer\s+/i, ''));
    const expected = Buffer.from(env.MCP_BEARER_TOKEN);
    if (presented.length !== expected.length || !crypto.timingSafeEqual(presented, expected)) {
        res.set('WWW-Authenticate', 'Bearer').status(401).json({ error: 'unauthorized' });
        return;
    }
    next();
};

app.post('/mcp', requireToken, async (req: Request, res: Response) => {
    // Stateless: one server + one transport per request (no sticky sessions).
    const server = buildServer();
    const transport = new NodeStreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    res.on('close', () => {
        void transport.close();
        void server.close();
    });
    await server.connect(transport);
    // Pass the already-parsed body so the transport does not re-read a consumed stream.
    await transport.handleRequest(req, res, req.body);
});

app.get('/healthz', (_req: Request, res: Response) => {
    res.json({ ok: true });
});

app.listen(env.PORT, env.BIND_HOST, () => {
    // stdout is free on the HTTP transport — the stdout rule is stdio-only.
    console.log(`[mcp] http on ${env.BIND_HOST}:${env.PORT}`);
});
