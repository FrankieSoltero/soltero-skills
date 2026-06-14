import { z } from "zod";

// Centralized, fail-fast environment validation. Import `env` from here instead of touching
// process.env directly — a missing or invalid variable fails at startup with a clear message,
// never silently at runtime. Add real vars to the schema; keep secrets server-only (no public prefix).
//
// Client-exposed vars MUST carry the framework's public prefix:
//   Next.js: NEXT_PUBLIC_*   Vite: VITE_* (read from import.meta.env)   Astro: PUBLIC_*   Expo: EXPO_PUBLIC_*
const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  // DATABASE_URL: z.string().url(),
  // NEXT_PUBLIC_API_URL: z.string().url(),
});

// Vite/Astro expose vars on import.meta.env, not process.env — swap the source there.
const source = typeof process !== "undefined" ? process.env : {};
const parsed = schema.safeParse(source);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment variables — see errors above.");
}

export const env = parsed.data;
export type Env = z.infer<typeof schema>;
