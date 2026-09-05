# Contributing to acme-ledger

This guide is for agents (Claude) and humans working on acme-ledger. It outlines the workflow, principles, and gotchas.

## Before You Start

1. Read `CLAUDE.md` for the quick overview and critical knowledge (especially "The Feb Drift Incident").
2. Read `docs/ARCHITECTURE.md` for deep technical context.
3. Run `npm install && npm run migrate && npm test` to verify your setup.

## What Kind of Change Are You Making?

### Bug Fix: Entry Posting Logic

1. **Write a failing test** in `test/post.test.js` that reproduces the bug.
2. **Fix the code** in `src/ledger/post.js` or in a plugin.
3. **Verify all tests pass:** `npm test`
4. **If it touches rounding:** Add a test to `test/rounding.test.js` that proves the fix is correct.
5. **Commit** with a clear message: `fix: [specific issue] in posting logic`

### Bug Fix: Rounding Issue

**This is a red alert.** Rounding bugs affect financial accuracy.

1. **Do not patch in place.** Document the discovered bug in `CLAUDE.md` or `doc/notes.md`.
2. **Write a failing test** in `test/rounding.test.js`.
3. **Consult the billing team** (if simulated: assume approval in commit message).
4. **Fix `src/ledger/rounding.js`** with extreme caution.
5. **Run all rounding tests:** `npm run test test/rounding.test.js`
6. **Commit** with a message that includes "billing team approval" reference.

### New Feature: HTTP Endpoint

1. **Design the endpoint** (URL, request shape, response shape). Document in `CLAUDE.md` under "API" section (add if missing).
2. **Write tests** in `test/` (new file, e.g., `test/reconcile.test.js`).
3. **Implement** in `src/http/router.js` and supporting files in `src/http/` or `src/ledger/`.
4. **Update `CLAUDE.md`** with the new endpoint.
5. **Verify:** `npm test`, `npm run lint`, `make dev` and manually test the endpoint.
6. **Commit** with: `feat: add [endpoint name] endpoint`

### New Feature: Plugin

1. **Design the plugin's hooks** (beforePost? afterPost?). Document in `CLAUDE.md` under "Plugin System".
2. **Create `src/plugins/my-feature.js`** following the contract in `CLAUDE.md`.
3. **Write tests** in `test/post.test.js` that use `post(input, [myPlugin])`.
4. **Verify:** `npm test`
5. **Commit** with: `feat: add [plugin name] plugin`

The plugin is auto-loaded at startup. No registration step needed.

### Schema Change: Add a Column

1. **Create a migration** in `migrations/`. Name it `000X_add_[column_name].sql`. Use the next available number.
   ```sql
   ALTER TABLE entries ADD COLUMN created_at TEXT DEFAULT CURRENT_TIMESTAMP;
   ```
2. **Update the schema description** in `CLAUDE.md`.
3. **Update the schema section** in `docs/ARCHITECTURE.md`.
4. **If the new column is required in posting:** Update `src/ledger/post.js` to populate it.
5. **Update tests** to cover the new column (add to fixtures, assert on queries).
6. **Verify:** `npm run migrate && npm test`
7. **Commit** with: `feat: add [column name] column to entries`

### Documentation Change

1. **Edit `CLAUDE.md`** for project-level guidance, principles, or navigation.
2. **Edit `docs/ARCHITECTURE.md`** for technical design details.
3. **Edit `doc/notes.md`** for short-lived gotchas or team awareness.
4. **Edit `CONTRIBUTING.md`** (this file) for workflow updates.
5. **Verify:** Spell-check, consistency with existing sections.
6. **Commit** with: `docs: [what you clarified or added]`

### Refactoring

1. **Ensure all tests pass before starting:** `npm test`
2. **Make the refactoring change** (rename function, extract module, etc.).
3. **Verify all tests still pass:** `npm test`
4. **Verify linting passes:** `npm run lint`
5. **If you changed the architecture:** Update `docs/ARCHITECTURE.md` and `CLAUDE.md`.
6. **Commit** with: `refactor: [what you simplified/reorganized]`

### Decision (ADR)

If you're making a decision that will affect future agents:

1. **Create a new file** in `docs/adr/`. Name it `000X_[title].md`. Use the next available number.
   ```markdown
   # ADR 000X — [Concise Decision Title]

   Status: [proposed | accepted | deprecated]
   Date: [YYYY-MM-DD]

   ## Context
   [What is the problem or situation?]

   ## Decision
   [What did we decide?]

   ## Rationale
   [Why this decision?]

   ## Consequences
   [What are the pros and cons?]

   ## Alternatives Considered
   [What else did we think about?]
   ```
2. **Link the ADR** from `CLAUDE.md` in the "Decision Log" section.
3. **Commit** with: `docs: ADR 000X — [title]`

---

## Development Workflow

### 1. Make Changes

Edit files in `src/`, `test/`, `migrations/`, or `docs/`.

### 2. Test Locally

```bash
npm test              # All tests
npm test -- test/post.test.js  # One file (Node 20+ only)
npm run lint          # Linting
make dev              # Interactive dev server
```

### 3. Verify the Full Stack

```bash
# In one terminal:
make dev

# In another:
curl -X POST http://localhost:8080/entries \
  -H 'Content-Type: application/json' \
  -d '{"side":"debit","amount":123.45,"currency":"USD"}'
```

Expected response: `{"side":"debit","amount":123.45,"cents":12345,"currency":"USD",...}`

### 4. Commit

```bash
git add [files you changed]
git commit -m "feat: [what you did]"
```

Commit messages should be clear and reference the why, not just what.

**Example good message:**
```
feat: add timestamp tracking to entries for audit trail

Billing team requested audit timestamps for SOX compliance. Added
created_at column to entries table, populated by DB default. Migration
0002 handles backfill.
```

**Example bad message:**
```
update stuff
```

### 5. Push & PR (if applicable)

Push your branch and open a PR. Reference any ADRs or decisions in the PR description.

---

## Common Mistakes & How to Avoid Them

### ❌ Using `Math.round()` in posting code

**Problem:** Floating-point drift causes reconciliation failures.

**Fix:** Always use `roundHalfEven()` from `src/ledger/rounding.js`.

```javascript
// ❌ WRONG
const cents = Math.round(amount * 100);

// ✅ RIGHT
import { roundHalfEven } from './rounding.js';
const cents = roundHalfEven(amount * 100);
```

### ❌ Updating an entry instead of inserting a new one

**Problem:** Breaks audit trail and reconciliation.

**Fix:** Always insert new entries. Corrections are new entries with the opposite side.

```javascript
// ❌ WRONG
UPDATE entries SET cents = 999 WHERE id = 123;

// ✅ RIGHT
INSERT INTO entries (side, cents, currency) VALUES ('credit', 1, 'USD');  -- Correction entry
```

### ❌ Forgetting to run migrations

**Problem:** Schema changes don't apply, tests fail mysteriously.

**Fix:** Always run `npm run migrate` after pulling or creating a migration.

```bash
npm run migrate  # Apply pending migrations
npm test         # Run tests with updated schema
```

### ❌ Adding a plugin but forgetting to test it

**Problem:** Plugin breaks posting, only discovered in production.

**Fix:** Test the plugin in `test/post.test.js` with `post(input, [myPlugin])`.

```javascript
test('my-plugin enriches entry', () => {
  const entry = post({ side: 'debit', amount: 100, currency: 'USD' }, [myPlugin]);
  assert(entry.enriched === true);
});
```

### ❌ Modifying `src/plugins/registry.js`

**Problem:** Plugin discovery breaks.

**Fix:** Leave `registry.js` alone. Add or remove plugins by adding/removing files in `src/plugins/`.

### ❌ Hardcoding a value that should be configurable

**Problem:** Next agent can't adjust behavior without code change.

**Fix:** Use environment variables (e.g., `process.env.PORT`) or plugin configuration.

---

## Testing Strategy

### Unit Tests

Test individual functions in isolation:

```javascript
// test/post.test.js
test('post normalizes amount to cents', () => {
  const entry = post({ amount: 123.45, side: 'debit', currency: 'USD' });
  assert.equal(entry.cents, 12345);
});
```

### Integration Tests

Test the full posting pipeline with plugins:

```javascript
test('posting with audit-log plugin marks entry as audited', () => {
  const entry = post(
    { amount: 100, side: 'debit', currency: 'USD' },
    [auditLogPlugin]
  );
  assert.equal(entry.audited, true);
});
```

### Database Tests

Ensure schema changes work:

```javascript
test('migration adds created_at column', () => {
  // This is implicit in the other tests if you use created_at in posting.
});
```

### Rounding Tests

Always verify rounding behavior:

```javascript
test('roundHalfEven handles edge cases', () => {
  assert.equal(roundHalfEven(2.5 * 100), 250);  // Rounds to even
  assert.equal(roundHalfEven(3.5 * 100), 350);  // Rounds to even
});
```

---

## Code Style

- **No frameworks:** Vanilla Node.js, ES modules, native HTTP.
- **Functional style:** Minimize side effects in business logic.
- **Naming:** Clear, descriptive names. `entry`, `cents`, `plugin`, not `e`, `c`, `p`.
- **Comments:** Explain the why, not the what. Code is readable; context is not.
- **No semicolons:** Consistent with the existing codebase.
- **ESLint:** Run `npm run lint` before committing.

---

## When Things Go Wrong

### A test fails

1. **Read the test** to understand what it's checking.
2. **Read the implementation** to see what might be wrong.
3. **Revert your change** to verify the test was passing before.
4. **Debug:** Add `console.log` statements or run the test in isolation.
5. **Fix and re-run:** `npm test`

### Migrations fail

1. **Check the SQL syntax** in the migration file.
2. **Run manually:** `sqlite3 ./var/dev.sqlite < migrations/000X_*.sql`
3. **Check the schema:** `sqlite3 ./var/dev.sqlite ".schema"`
4. **Revert:** Delete the migration file and re-run `npm run migrate`.

### The server won't start

1. **Check for syntax errors:** `node -c src/app.js`
2. **Check environment variables:** `echo $LEDGER_DB_PATH $PORT`
3. **Check the database file:** `sqlite3 $LEDGER_DB_PATH ".tables"`
4. **Check for stuck processes:** `lsof -i :8080`

### Entries aren't being recorded

1. **Is the database writable?** `touch $LEDGER_DB_PATH`
2. **Does the table exist?** `sqlite3 $LEDGER_DB_PATH ".schema entries"`
3. **Is the plugin blocking?** Check `beforePost` hooks for rejections or errors.
4. **Check the network:** `curl -v -X POST ...`

---

## Handoff to the Next Agent

When you finish your work:

1. **Update `CLAUDE.md`:**
   - Add any new principles, gotchas, or architecture notes.
   - Update file navigation table if files moved.
   - Update quick start if dev workflow changed.

2. **Update `docs/ARCHITECTURE.md`:**
   - Reflect any architectural changes.
   - Add rationale for decisions.

3. **Update `doc/notes.md`:**
   - Short-lived gotchas or team awareness items.
   - Anything the team should know this quarter.

4. **Update `docs/adr/`:**
   - Add a new ADR if you made a significant decision.

5. **Commit clearly:**
   ```bash
   git commit -m "feat: [what you did]

   [One or two sentences explaining the why and impact.]"
   ```

6. **Leave a comment in the PR or commit:**
   - What was built and why.
   - Any assumptions made.
   - What the next agent should check if they're extending this work.

---

## Questions?

Refer to:
- `CLAUDE.md` for quick answers and navigation.
- `docs/ARCHITECTURE.md` for deep technical context.
- `doc/notes.md` for team awareness.
- `docs/adr/` for decisions and context.
- Source code comments for specific implementation details.

---

Generated: 2026-09-05
