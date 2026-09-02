import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { classify, parseDotenv, parseTarget } from './resolve-target.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const cli = join(here, 'resolve-target.mjs');

const run = (args, env) => {
  try {
    const stdout = execFileSync('node', [cli, ...args], { encoding: 'utf8', env: { ...process.env, ...env } });
    return { code: 0, stdout };
  } catch (e) {
    return { code: e.status, stdout: e.stdout ?? '', stderr: e.stderr ?? '' };
  }
};

test('a hosted provider with no non-production marker resolves to production', () => {
  const r = classify('postgresql://app:pw@ep-shrill-band-42891.us-east-2.aws.neon.tech/lastcall?sslmode=require');
  assert.equal(r.classification, 'production');
  assert.match(r.reason, /hosted database provider/);
  assert.match(r.reason, /treated as production/);
});

test('a non-production marker anywhere in host, database, or user resolves to staging', () => {
  for (const url of [
    'postgresql://app:pw@ep-quiet-dawn.neon.tech/lastcall_staging',
    'postgresql://app:pw@staging-db.acme-corp.io/lastcall',
    'postgresql://qa:pw@ep-x.neon.tech/lastcall',
    'mysql://app:pw@preview-9c1.planetscale.com/shop',
  ]) {
    assert.equal(classify(url).classification, 'staging', url);
  }
});

test('production markers need word boundaries — "products" is not "prod"', () => {
  assert.equal(classify('postgresql://app:pw@db.acme.io/products').classification, 'unknown');
  assert.equal(classify('postgresql://app:pw@db-prod.acme.io/shop').classification, 'production');
});

test('loopback and file targets are local, and the host is decisive over a name marker', () => {
  assert.equal(classify('postgres://me@localhost:5432/lastcall_dev').classification, 'local');
  assert.equal(classify('postgres://me@127.0.0.1/anything').classification, 'local');
  assert.equal(classify('file:./dev.db').classification, 'local');
  const r = classify('postgres://me@localhost:5432/lastcall_prod');
  assert.equal(r.classification, 'local');
  assert.match(r.reason, /host is decisive/);
});

test('an unrecognised remote host is unknown, not safe — and unknown exits 1', () => {
  const r = classify('postgres://u:p@db.internal.acme.io/app');
  assert.equal(r.classification, 'unknown');
  assert.equal(run(['--url', 'postgres://u:p@db.internal.acme.io/app']).code, 1);
  assert.equal(run(['--url', 'postgres://u:p@ep-a.neon.tech/lastcall']).code, 0);
});

test('conflicting markers in one target resolve to unknown rather than picking a side', () => {
  const r = classify('postgresql://app:pw@prod-db.acme.io/lastcall_staging');
  assert.equal(r.classification, 'unknown');
  assert.match(r.reason, /conflicting markers/);
});

test('an unparseable connection string is unknown, never local', () => {
  assert.equal(classify('¯\\_(ツ)_/¯').classification, 'unknown');
  assert.equal(classify('').classification, 'unknown');
});

test('environment-name variables escalate but never downgrade', () => {
  const staging = 'postgresql://app:pw@ep-x.neon.tech/lastcall_staging';
  assert.equal(classify(staging, { NODE_ENV: 'production' }).classification, 'unknown');
  const unknownHost = 'postgres://u:p@db.internal.acme.io/app';
  assert.equal(classify(unknownHost, { NODE_ENV: 'production' }).classification, 'production');
  const prod = 'postgresql://app:pw@ep-x.neon.tech/lastcall';
  const r = classify(prod, { NODE_ENV: 'development' });
  assert.equal(r.classification, 'production');
  assert.match(r.reason, /never downgrades a resolved host/);
});

test('the password is never emitted, in text or json output', () => {
  const url = 'postgresql://app:sup3rs3cret@ep-x.neon.tech/lastcall';
  assert.ok(!classify(url).target.redacted.includes('sup3rs3cret'));
  const text = run(['--url', url]).stdout;
  const json = run(['--url', url, '--json']).stdout;
  assert.ok(!text.includes('sup3rs3cret'), text);
  assert.ok(!json.includes('sup3rs3cret'), json);
  assert.match(text, /:\*\*\*@/);
});

test('parseDotenv handles quotes, export, comments, and blank values', () => {
  const v = parseDotenv([
    '# comment',
    'NODE_ENV=production',
    'export DATABASE_URL="postgres://a:b@h/db"',
    "OTHER='x y'",
    'EMPTY=',
    'INLINE=value # trailing',
  ].join('\n'));
  assert.equal(v.NODE_ENV, 'production');
  assert.equal(v.DATABASE_URL, 'postgres://a:b@h/db');
  assert.equal(v.OTHER, 'x y');
  assert.equal(v.EMPTY, '');
  assert.equal(v.INLINE, 'value');
});

test('parseTarget splits scheme, user, host, database and drops the port', () => {
  const t = parseTarget('postgresql://app:pw@ep-x.neon.tech:5432/lastcall?sslmode=require');
  assert.equal(t.scheme, 'postgresql');
  assert.equal(t.user, 'app');
  assert.equal(t.host, 'ep-x.neon.tech');
  assert.equal(t.database, 'lastcall');
});

test('--dotenv reads DATABASE_URL and reports the source; --assert gates the exit code', () => {
  const dir = mkdtempSync(join(tmpdir(), 'dog-resolve-'));
  const file = join(dir, '.env');
  writeFileSync(file, 'NODE_ENV=production\nDATABASE_URL=postgresql://app:pw@ep-x.neon.tech/lastcall\n');
  const r = run(['--dotenv', file]);
  assert.equal(r.code, 0);
  assert.match(r.stdout, /TARGET: PRODUCTION/);
  assert.match(r.stdout, /→ DATABASE_URL/);
  assert.equal(run(['--dotenv', file, '--assert', 'local']).code, 1);
  assert.equal(run(['--dotenv', file, '--assert', 'production']).code, 0);
});

test('--env-var reads the live process environment', () => {
  const r = run(['--env-var', 'DOG_TEST_URL'], { DOG_TEST_URL: 'postgres://me@localhost/dev' });
  assert.equal(r.code, 0);
  assert.match(r.stdout, /TARGET: LOCAL/);
});

test('missing input and unreadable files are usage errors (exit 2), not classifications', () => {
  assert.equal(run([]).code, 2);
  assert.equal(run(['--dotenv', '/nonexistent/.env']).code, 2);
  assert.equal(run(['--assert', 'nonsense', '--url', 'postgres://x@localhost/d']).code, 2);
});
