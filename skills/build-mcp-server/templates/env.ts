// Zod-validated environment. Fails fast at startup with a clear message — no hardcoded secrets.
import { z } from "zod";

const Env = z.object({
  PORT: z.coerce.number().int().positive().default(8080),
  BIND_HOST: z.string().default("127.0.0.1"),
  // Comma-separated Host allowlist for DNS-rebinding protection when BIND_HOST is non-localhost
  // (e.g. 0.0.0.0 behind a TLS proxy). Parsed into string[] | undefined.
  ALLOWED_HOSTS: z
    .string()
    .optional()
    .transform((s) => (s ? s.split(",").map((h) => h.trim()).filter(Boolean) : undefined)),
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
