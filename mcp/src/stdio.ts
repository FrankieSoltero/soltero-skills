#!/usr/bin/env node
// stdio entry — MCP clients launch this as a subprocess.
// THE STDOUT RULE: stdout IS the JSON-RPC stream. Never console.log here —
// the bundled logger writes to stderr only. One stray stdout line corrupts
// the protocol and the client silently disconnects.
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { buildServer } from "./server.js";
import { assertSkillsDir, resolveSkillsDir } from "./skills.js";
import { logger } from "./logger.js";

async function main(): Promise<void> {
  // Fail fast at startup with a clear stderr message if the skills dir is
  // missing or unreadable (SOLTERO_SKILLS_DIR overrides the default).
  const skillsDir = resolveSkillsDir();
  try {
    assertSkillsDir(skillsDir);
  } catch (err) {
    logger.error({ err: (err as Error).message }, "fatal: skills directory");
    process.exit(1);
  }

  const server = buildServer({ skillsDir });
  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info({ skillsDir }, "soltero-skills MCP server running on stdio");

  const shutdown = async (): Promise<void> => {
    await server.close();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  logger.error({ err: (err as Error).message }, "fatal");
  process.exit(1);
});
