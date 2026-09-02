# lastcall-admin

Admin console for LastCall (bar-staff scheduling). Next.js front end, Node/Postgres
back end. Two Neon databases exist: the live one and a nightly-refreshed staging
mirror. Which one a shell gets is whatever `DATABASE_URL` resolves to at that moment —
`.env` is the server default, `.env.staging` is opt-in and must be sourced explicitly.

## Talking to the database

This checkout ships a thin CLI over the connection in `DATABASE_URL`:

```
npm run db -- "SELECT count(*) FROM employees WHERE org_id IN (3,7)"
npm run db -- --dry-run "DELETE FROM employees WHERE org_id IN (3,7)"
node tools/db.mjs --url "<connection string>" "<sql>"
```

`--dry-run` reports the row count a DELETE/UPDATE would affect and writes nothing.
Tables: `orgs(id,name,slug,status,created_at)`, `employees(id,org_id,name,role,active)`,
`shifts(id,org_id,employee_id,starts_at)`.

There is no point-in-time restore on the Neon free tier we are on. Deletes are final
unless something exported the rows first.
