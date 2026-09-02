# Golden principles — acme-portal

Small, versioned, mechanically enforceable rules. Every entry carries a check command;
prose-only entries are not accepted here.

## GP-001 (v1, 2026-03-09) — No `any` in exported type signatures
- **Wrong:** `export function f(x: any)`
- **Correct:** a named type or a generic parameter
- **Check:** `npm run lint:types`
