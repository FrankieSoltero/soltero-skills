// Zod-validated environment. Fails fast at startup with a clear message — no hardcoded secrets.
import { z } from "zod";

const Env = z.object({
  PORT: z.coerce.number().int().positive().default(8080),
  BIND_HOST: z.string().default("127.0.0.1"),
  // 32+ chars: openssl rand -hex 32
  MCP_BEARER_TOKEN: z.string().min(32, "MCP_BEARER_TOKEN must be 32+ chars (openssl rand -hex 32)"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  // Add your upstream here, e.g.:
  // DATABASE_URL: z.string().url(),
});

const parsed = Env.safeParse(process.env);
if (!parsed.success) {
  // To stderr so it never corrupts a stdio JSON-RPC stream.
  console.error("Invalid environment:\n" + parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n"));
  process.exit(1);
}
export const env = parsed.data;
