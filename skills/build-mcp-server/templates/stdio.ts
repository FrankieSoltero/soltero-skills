#!/usr/bin/env node
// stdio entry — for LOCAL clients (Claude Code/Desktop launch this as a subprocess).
// THE STDOUT RULE: on stdio, stdout IS the JSON-RPC stream. Never console.log here —
// log to stderr (the bundled logger writes to stderr). One stray stdout line disconnects the client.
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { buildServer } from "./server.js";
import { logger } from "./logger.js";

async function main() {
  const server = buildServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info("item-store running on stdio"); // stderr — safe

  const shutdown = async () => { await server.close(); process.exit(0); };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  logger.error({ err: (err as Error).message }, "fatal");
  process.exit(1);
});
