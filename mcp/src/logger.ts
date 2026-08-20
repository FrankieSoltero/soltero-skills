// Structured logger that writes to STDERR — stdout is the stdio JSON-RPC
// channel and must stay clean (a single stdout line corrupts the protocol).
type Fields = Record<string, unknown>;
const levels = { debug: 10, info: 20, warn: 30, error: 40 } as const;
type Level = keyof typeof levels;

function currentThreshold(): number {
  const fromEnv = (process.env.SOLTERO_SKILLS_LOG_LEVEL ??
    process.env.LOG_LEVEL) as Level | undefined;
  return (fromEnv && levels[fromEnv]) || levels.info;
}

function emit(level: Level, a: Fields | string, b?: string): void {
  if (levels[level] < currentThreshold()) return;
  const msg = typeof a === "string" ? a : (b ?? "");
  const fields = typeof a === "string" ? {} : a;
  // process.stderr — NEVER process.stdout / console.log on a stdio server.
  process.stderr.write(
    JSON.stringify({ level, msg, ...fields, t: Date.now() }) + "\n",
  );
}

export const logger = {
  debug: (a: Fields | string, b?: string) => emit("debug", a, b),
  info: (a: Fields | string, b?: string) => emit("info", a, b),
  warn: (a: Fields | string, b?: string) => emit("warn", a, b),
  error: (a: Fields | string, b?: string) => emit("error", a, b),
};
