// Structured logger that writes to STDERR — safe for both transports (stdout is the stdio
// JSON-RPC channel and must stay clean). Swap in pino for production if you want JSON + levels;
// this dependency-free shim keeps the example self-contained.
type Fields = Record<string, unknown>;
const levels = { debug: 10, info: 20, warn: 30, error: 40 } as const;
type Level = keyof typeof levels;

const threshold = levels[(process.env.LOG_LEVEL as Level) ?? "info"] ?? levels.info;

function emit(level: Level, a: Fields | string, b?: string) {
  if (levels[level] < threshold) return;
  const msg = typeof a === "string" ? a : b ?? "";
  const fields = typeof a === "string" ? {} : a;
  // process.stderr — NEVER process.stdout / console.log on a stdio server.
  process.stderr.write(JSON.stringify({ level, msg, ...fields, t: Date.now() }) + "\n");
}

export const logger = {
  debug: (a: Fields | string, b?: string) => emit("debug", a, b),
  info: (a: Fields | string, b?: string) => emit("info", a, b),
  warn: (a: Fields | string, b?: string) => emit("warn", a, b),
  error: (a: Fields | string, b?: string) => emit("error", a, b),
};
