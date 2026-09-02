#!/usr/bin/env node
// destructive-op-gate: resolve what a connection string / env file ACTUALLY points at.
// Classifies production / staging / local / unknown with a stated reason. FAIL-CLOSED:
// an unresolvable target exits non-zero, because "I could not tell" must not read as safe.
//
// Usage:
//   node resolve-target.mjs --url "postgresql://u:p@host/db"
//   node resolve-target.mjs --dotenv .env [--var DATABASE_URL]
//   node resolve-target.mjs --env-var DATABASE_URL
//   ... [--json] [--assert local|staging|production]
//
// Exit codes: 0 resolved (production/staging/local, or a satisfied --assert)
//             1 unknown (fail closed) or --assert not satisfied
//             2 usage error / no input
//
// Credentials are never printed: every URL is emitted with the password replaced by ***.
import { readFileSync } from 'node:fs';

export const PROD_MARKER = /(?<![a-z])(prod|production|prd|live)(?![a-z])/;
export const NONPROD_MARKER =
  /(?<![a-z])(staging|stage|dev|devel|development|test|testing|tests|preview|qa|uat|sandbox|demo|ephemeral|scratch|ci|local)(?![a-z])/;
export const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]', '0.0.0.0', 'host.docker.internal']);
// Hosted database/app providers: a remote target on one of these with no non-production
// marker is treated as production rather than unknown — the default must be the expensive
// assumption, not the convenient one.
export const MANAGED_HOST =
  /(neon\.tech|supabase\.(co|com)|rds\.amazonaws\.com|redshift\.amazonaws\.com|render\.com|planetscale\.com|psdb\.cloud|pscale\.dev|mongodb\.net|upstash\.io|cockroachlabs\.cloud|aivencloud\.com|timescaledb\.io|herokuapp\.com|heroku(postgres)?\.com|ondigitalocean\.com|railway\.app|fly\.dev|azure\.com|cloudsql|gcp\.[a-z]+\.com|clever-cloud\.com|elephantsql\.com|scalingo\.io)/;
const ENV_NAME_VARS = ['NODE_ENV', 'APP_ENV', 'RAILS_ENV', 'VERCEL_ENV', 'ENVIRONMENT', 'DEPLOY_ENV'];

export function parseDotenv(text) {
  const out = {};
  for (const line of text.split('\n')) {
    const m = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
    if (!m || /^\s*#/.test(line)) continue;
    let v = m[2].trim();
    const q = /^(['"])([\s\S]*)\1\s*(?:#.*)?$/.exec(v);
    v = q ? q[2] : v.replace(/\s+#.*$/, '').trim();
    out[m[1]] = v;
  }
  return out;
}

/** Split a connection string without ever retaining the password. */
export function parseTarget(raw) {
  const value = String(raw ?? '').trim();
  if (!value) return null;
  const m = /^([a-z][a-z0-9+.-]*):\/\/(?:([^:@/]+)(?::([^@/]*))?@)?([^/?#]*)(?:\/([^?#]*))?/i.exec(value);
  if (m) {
    const [, scheme, user, password, authority, path] = m;
    const host = (authority || '').replace(/:\d+$/, '').toLowerCase();
    return {
      scheme: scheme.toLowerCase(),
      user: user || '',
      host,
      database: (path || '').split('/')[0] || '',
      redacted: password === undefined ? value : value.replace(`:${password}@`, ':***@'),
    };
  }
  if (/^(file:|sqlite:|\.?\/|[a-z]:\\)/i.test(value) || /\.(db|sqlite3?)$/i.test(value)) {
    return { scheme: 'file', user: '', host: '', database: value.replace(/^(file|sqlite):(\/\/)?/i, ''), redacted: value };
  }
  if (/^[a-z0-9.-]+(:\d+)?$/i.test(value)) {
    return { scheme: '', user: '', host: value.replace(/:\d+$/, '').toLowerCase(), database: '', redacted: value };
  }
  return null;
}

/**
 * Classify a target. `envNames` are environment-name variables read from the same source;
 * they may only ESCALATE a classification (unknown -> production, staging -> unknown as a
 * conflict). They never de-escalate: a claim in a file does not make a live host safe.
 */
export function classify(raw, envNames = {}) {
  const t = parseTarget(raw);
  if (!t) {
    return { classification: 'unknown', reason: 'connection string could not be parsed, so its target is unresolved', target: null };
  }
  const hay = [t.host, t.database, t.user].filter(Boolean).join(' ').toLowerCase();
  const prod = PROD_MARKER.exec(hay);
  const nonprod = NONPROD_MARKER.exec(hay);
  const isLocalHost = LOCAL_HOSTS.has(t.host) || /(^|\.)localhost$/.test(t.host) || /\.local$/.test(t.host);
  const declared = ENV_NAME_VARS.map((k) => [k, (envNames[k] || '').toLowerCase()]).filter(([, v]) => v);
  const declaredProd = declared.find(([, v]) => PROD_MARKER.test(v));
  const declaredNonProd = declared.find(([, v]) => NONPROD_MARKER.test(v));

  let out;
  if (t.scheme === 'file' || (t.scheme === 'sqlite' && !t.host)) {
    out = { classification: 'local', reason: `file-backed database on this machine (${t.database})` };
  } else if (isLocalHost) {
    out = { classification: 'local', reason: `loopback host ${t.host} — reachable only from this machine` };
    if (prod) out.reason += `; note the "${prod[1]}" marker in the target name, but the host is decisive`;
  } else if (prod && nonprod) {
    out = { classification: 'unknown', reason: `conflicting markers in the target: "${prod[1]}" and "${nonprod[1]}" — resolve by hand before writing` };
  } else if (nonprod) {
    out = { classification: 'staging', reason: `remote host with a non-production marker ("${nonprod[1]}") in ${t.host}${t.database ? '/' + t.database : ''}` };
  } else if (prod) {
    out = { classification: 'production', reason: `remote host with a production marker ("${prod[1]}") in ${t.host}${t.database ? '/' + t.database : ''}` };
  } else if (MANAGED_HOST.test(t.host)) {
    out = { classification: 'production', reason: `hosted database provider (${t.host}) with no non-production marker in host, database, or user — treated as production` };
  } else {
    out = { classification: 'unknown', reason: `remote host ${t.host} matches no known local, non-production, or hosted-provider pattern — unresolved` };
  }

  if (declaredProd && out.classification === 'staging') {
    out = { classification: 'unknown', reason: `${out.reason}; but ${declaredProd[0]}=${declaredProd[1]} in the same source contradicts it — conflicting evidence` };
  } else if (declaredProd && out.classification === 'unknown') {
    out = { classification: 'production', reason: `${out.reason}; ${declaredProd[0]}=${declaredProd[1]} in the same source resolves it upward to production` };
  } else if (declaredProd && out.classification === 'production') {
    out.reason += `; corroborated by ${declaredProd[0]}=${declaredProd[1]}`;
  } else if (declaredNonProd && out.classification === 'production') {
    out.reason += `; ${declaredNonProd[0]}=${declaredNonProd[1]} claims otherwise, but an environment-name variable never downgrades a resolved host`;
  }
  return { ...out, target: t };
}

function usage(msg) {
  const out = msg ? process.stderr : process.stdout;
  out.write(`${msg ? msg + '\n' : ''}usage: resolve-target.mjs (--url <conn> | --dotenv <path> [--var NAME] | --env-var NAME) [--json] [--assert local|staging|production]\n`);
  process.exit(msg ? 2 : 0);
}

export function main(argv, env = process.env) {
  const opts = { json: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') { usage('') ; }
    else if (a === '--url') opts.url = argv[++i];
    else if (a === '--dotenv') opts.dotenv = argv[++i];
    else if (a === '--env-var') opts.envVar = argv[++i];
    else if (a === '--var') opts.var = argv[++i];
    else if (a === '--json') opts.json = true;
    else if (a === '--assert') opts.assert = argv[++i];
    else usage(`unknown option: ${a}`);
  }
  if (opts.assert && !['local', 'staging', 'production'].includes(opts.assert)) usage(`--assert takes local|staging|production`);

  let raw = null;
  let source = null;
  let envNames = {};
  if (opts.url) {
    raw = opts.url;
    source = '--url';
  } else if (opts.dotenv) {
    let text;
    try {
      text = readFileSync(opts.dotenv, 'utf8');
    } catch (e) {
      usage(`cannot read ${opts.dotenv}: ${e.code || e.message}`);
    }
    const vars = parseDotenv(text);
    envNames = vars;
    const name = opts.var
      || (vars.DATABASE_URL !== undefined ? 'DATABASE_URL'
        : Object.keys(vars).find((k) => /_(URL|URI|DSN)$/.test(k) && /:\/\//.test(vars[k] || '')));
    if (!name || vars[name] === undefined) usage(`no connection variable found in ${opts.dotenv} (looked for DATABASE_URL, then *_URL/_URI/_DSN)`);
    raw = vars[name];
    source = `${opts.dotenv} → ${name}`;
  } else if (opts.envVar) {
    raw = env[opts.envVar];
    envNames = env;
    if (raw === undefined) usage(`environment variable ${opts.envVar} is not set`);
    source = `process env → ${opts.envVar}`;
  } else {
    usage('no target given');
  }

  const res = classify(raw, envNames);
  const payload = {
    source,
    classification: res.classification,
    reason: res.reason,
    scheme: res.target?.scheme ?? null,
    host: res.target?.host ?? null,
    database: res.target?.database ?? null,
    user: res.target?.user ?? null,
    url: res.target?.redacted ?? null,
  };
  if (opts.json) process.stdout.write(JSON.stringify(payload, null, 2) + '\n');
  else {
    process.stdout.write(`TARGET: ${payload.classification.toUpperCase()}\n`);
    for (const k of ['source', 'host', 'database', 'user', 'url', 'reason']) {
      if (payload[k]) process.stdout.write(`  ${k.padEnd(9)}${payload[k]}\n`);
    }
  }
  if (opts.assert) {
    const ok = payload.classification === opts.assert;
    process.stdout.write(`ASSERT ${opts.assert}: ${ok ? 'ok' : `FAILED — resolved ${payload.classification}`}\n`);
    return ok ? 0 : 1;
  }
  return payload.classification === 'unknown' ? 1 : 0;
}

if (import.meta.url === `file://${process.argv[1]}`) process.exit(main(process.argv.slice(2)));
