import { test } from 'node:test';
import assert from 'node:assert/strict';
import { matchDestructiveShapes as match } from './destructive-shapes.mjs';

const ids = (c) => match(c).map((h) => h.id).sort();

test('DROP / TRUNCATE are matched inside a quoted -c payload', () => {
  assert.deepEqual(ids(`psql "$DATABASE_URL" -c 'DROP TABLE employees'`), ['sql-drop']);
  assert.deepEqual(ids(`psql -c "truncate table shifts"`), ['sql-truncate']);
  assert.deepEqual(ids(`mysql -e 'drop database lastcall'`), ['sql-drop']);
});

test('DELETE and UPDATE are matched only when the WHERE clause is absent', () => {
  assert.deepEqual(ids(`psql -c 'delete from employees'`), ['sql-delete-without-where']);
  assert.deepEqual(ids(`psql -c 'DELETE FROM employees WHERE org_id IN (1,2)'`), []);
  assert.deepEqual(ids(`psql -c "update shifts set employee_id = null"`), ['sql-update-without-where']);
  assert.deepEqual(ids(`psql -c "UPDATE shifts SET active = false WHERE id = 3"`), []);
});

test('schema-resetting migration commands are matched', () => {
  assert.deepEqual(ids('npx prisma migrate reset --force'), ['migration-reset']);
  assert.deepEqual(ids('npx prisma db push --accept-data-loss'), ['migration-reset']);
  assert.deepEqual(ids('dropdb lastcall'), ['migration-reset']);
  assert.deepEqual(ids('npx prisma migrate deploy'), []);
  assert.deepEqual(ids('npx prisma db push'), []);
});

test('rm -rf is matched outside /tmp and ignored inside it', () => {
  assert.deepEqual(ids('rm -rf /Users/me/project/node_modules'), ['rm-rf']);
  assert.deepEqual(ids('rm -rf /tmp/scratch-workspace'), []);
  assert.deepEqual(ids('rm -rf /private/tmp/x /tmp/y'), []);
  assert.deepEqual(ids('rm -fr ~/Library/Caches/thing'), ['rm-rf']);
  assert.deepEqual(ids('rm -i file.txt'), []);
});

test('rm -rf with an unresolvable target is matched even when it looks temp-scoped', () => {
  const hits = match('rm -rf "$BUILD_DIR"/dist');
  assert.deepEqual(hits.map((h) => h.id), ['rm-rf-unresolved']);
  assert.match(hits[0].why, /not resolvable from the command text/);
  assert.deepEqual(ids('rm -rf /tmp/$SESSION'), ['rm-rf-unresolved']);
  assert.deepEqual(ids('rm -rf build/*'), ['rm-rf-unresolved']);
});

test('a shape in any clause of a compound command is found', () => {
  assert.deepEqual(
    ids(`npm run build && psql -c 'truncate table shifts' && npm test`),
    ['sql-truncate'],
  );
  assert.deepEqual(ids('cd /srv/app; rm -rf /srv/app/data'), ['rm-rf']);
});

test('quoted text that merely mentions a destructive command is not a false positive', () => {
  assert.deepEqual(ids('echo "never run DROP TABLE employees in prod" >> NOTES.md'), []);
  assert.deepEqual(ids('grep -n "rm -rf /etc" scripts/*.sh'), []);
});

test('each hit carries a reason and the clause that produced it; nothing matches empty input', () => {
  const [hit] = match(`psql -c 'DROP TABLE employees'`);
  assert.match(hit.why, /no row-level undo/);
  assert.match(hit.clause, /DROP TABLE employees/);
  assert.deepEqual(match(''), []);
  assert.deepEqual(match(undefined), []);
  assert.deepEqual(match('ls -la'), []);
});
