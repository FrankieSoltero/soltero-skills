#!/usr/bin/env bash
# Rebuild the three scenario workspaces used by tests/scenarios/agent-swarm.
# Deterministic and synthetic: safe to re-run before every RED / GREEN batch.
#
# Usage: bash tests/scenarios/agent-swarm/fixtures/setup-workspaces.sh
set -euo pipefail

# ---------------------------------------------------------------- scenario 1: /tmp/acme-crm
# ~60 files under src/. A dozen route handlers return customer objects; some go through
# redact(), some do not. The work-list a scout should find is "files that write a response".
rm -rf /tmp/acme-crm && mkdir -p /tmp/acme-crm/src/{routes,services,models,lib,jobs}
cat > /tmp/acme-crm/package.json <<'EOF'
{ "name": "acme-crm", "version": "1.4.0", "type": "module", "scripts": { "test": "node --test" } }
EOF
cat > /tmp/acme-crm/src/lib/redact.js <<'EOF'
const PII = ['email', 'phone', 'ssn', 'dob'];
export function redact(obj) {
  const out = { ...obj };
  for (const k of PII) if (k in out) out[k] = '[redacted]';
  return out;
}
EOF
cat > /tmp/acme-crm/src/models/customer.js <<'EOF'
export function customer(id) {
  return { id, name: 'Sample Customer', email: `c${id}@example.com`, phone: '555-0100', ssn: '000-00-0000', dob: '1990-01-01' };
}
EOF
for i in $(seq 1 12); do
  if (( i % 3 == 0 )); then
    cat > /tmp/acme-crm/src/routes/route$i.js <<EOF
import { customer } from '../models/customer.js';
import { redact } from '../lib/redact.js';
export function handler$i(req, res) {
  const c = customer(req.params.id);
  res.json(redact(c));
}
EOF
  else
    cat > /tmp/acme-crm/src/routes/route$i.js <<EOF
import { customer } from '../models/customer.js';
export function handler$i(req, res) {
  const c = customer(req.params.id);
  res.json({ ok: true, customer: c });
}
EOF
  fi
done
for i in $(seq 1 20); do
  cat > /tmp/acme-crm/src/services/service$i.js <<EOF
export function compute$i(x) { return x * $i; }
EOF
done
for i in $(seq 1 15); do
  cat > /tmp/acme-crm/src/lib/util$i.js <<EOF
export const util$i = (s) => String(s).trim();
EOF
done
for i in $(seq 1 10); do
  cat > /tmp/acme-crm/src/jobs/job$i.js <<EOF
export async function job$i() { return 'job$i done'; }
EOF
done

# ---------------------------------------------------------------- scenario 2: /tmp/acme-shop
# Forty files call legacyFetch(); each must move to httpClient. Writers must not overlap.
rm -rf /tmp/acme-shop && mkdir -p /tmp/acme-shop/src/{lib,cart,catalog,checkout,account} /tmp/acme-shop/test
cat > /tmp/acme-shop/package.json <<'EOF'
{ "name": "acme-shop", "version": "3.2.1", "type": "module", "scripts": { "test": "node --test test/" } }
EOF
cat > /tmp/acme-shop/src/lib/legacyFetch.js <<'EOF'
// Deprecated: use httpClient.get/post instead.
export async function legacyFetch(url, opts = {}) {
  return { status: 200, json: async () => ({ url, method: opts.method || 'GET' }) };
}
EOF
cat > /tmp/acme-shop/src/lib/httpClient.js <<'EOF'
export const httpClient = {
  async get(url) { return { url, method: 'GET' }; },
  async post(url, body) { return { url, method: 'POST', body }; },
};
EOF
n=0
for area in cart catalog checkout account; do
  for i in $(seq 1 10); do
    n=$((n+1))
    cat > /tmp/acme-shop/src/$area/$area$i.js <<EOF
import { legacyFetch } from '../lib/legacyFetch.js';
export async function load$area$i(id) {
  const r = await legacyFetch('/api/$area/' + id);
  return r.json();
}
EOF
  done
done
cat > /tmp/acme-shop/test/smoke.test.js <<'EOF'
import { test } from 'node:test';
import assert from 'node:assert';
import { loadcart1 } from '../src/cart/cart1.js';
test('cart1 loads', async () => {
  const r = await loadcart1(7);
  assert.equal(typeof r.url, 'string');
});
EOF
(cd /tmp/acme-shop && git init -q && git add -A && git -c user.email=fixture@example.com -c user.name=fixture commit -qm 'fixture') >/dev/null

# ---------------------------------------------------------------- scenario 3: /tmp/acme-billing
# A reconcile job, a ledger writer, rounding helpers, a cron wrapper, and logs.
rm -rf /tmp/acme-billing && mkdir -p /tmp/acme-billing/src/{jobs,ledger,lib} /tmp/acme-billing/bin /tmp/acme-billing/var/log
cat > /tmp/acme-billing/package.json <<'EOF'
{ "name": "acme-billing", "version": "0.9.7", "type": "module" }
EOF
cat > /tmp/acme-billing/src/lib/money.js <<'EOF'
export function toCents(amount) { return Math.round(amount * 100); }
export function fromCents(cents) { return cents / 100; }
export function applyRate(cents, rate) { return Math.floor(cents * rate); }
export function split(cents, parts) { const each = Math.floor(cents / parts); return Array(parts).fill(each); }
EOF
cat > /tmp/acme-billing/src/ledger/write.js <<'EOF'
import { fromCents } from '../lib/money.js';
const rows = [];
export function post(accountId, cents, memo) { rows.push({ accountId, amount: fromCents(cents), memo }); }
export function balance(accountId) { return rows.filter(r => r.accountId === accountId).reduce((a, r) => a + r.amount, 0); }
EOF
cat > /tmp/acme-billing/src/jobs/reconcile.js <<'EOF'
import { toCents, applyRate, split } from '../lib/money.js';
import { post, balance } from '../ledger/write.js';
export function reconcile(invoices) {
  let drift = 0;
  for (const inv of invoices) {
    const cents = toCents(inv.total);
    const fee = applyRate(cents, 0.029);
    const parts = split(cents - fee, inv.lines.length);
    parts.forEach((p, i) => post(inv.accountId, p, `line ${i}`));
    drift += (cents - fee) - parts.reduce((a, b) => a + b, 0);
  }
  return { drift, balance: balance('acct-1') };
}
EOF
cat > /tmp/acme-billing/bin/nightly.sh <<'EOF'
#!/usr/bin/env bash
# cron: 5 2 * * * /srv/acme-billing/bin/nightly.sh
TZ=UTC node -e "import('/srv/acme-billing/src/jobs/reconcile.js').then(m => console.log(JSON.stringify(m.reconcile([]))))" >> /srv/acme-billing/var/log/reconcile.log 2>&1
EOF
for d in $(seq 1 21); do
  printf '2026-08-%02d 02:05:01 reconcile drift=%d cents balance=104233.17\n' "$d" $((d % 4 + 1)) >> /tmp/acme-billing/var/log/reconcile.log
done
for i in $(seq 1 8); do
  cat > /tmp/acme-billing/src/lib/helper$i.js <<EOF
export const helper$i = (x) => x;
EOF
done

echo "workspaces ready: /tmp/acme-crm /tmp/acme-shop /tmp/acme-billing"

# ---------------------------------------------------------------- canary (skill-ab-eval): /tmp/acme-monorepo
# Six packages with READMEs; three carry a stale `npm install -g acme-cli@1` line. Same shape
# as scenario 1 (a find sweep); used only by the A/B eval's canary scenario.
rm -rf /tmp/acme-monorepo && mkdir -p /tmp/acme-monorepo/packages
for p in api web worker cli sdk docs; do
  mkdir -p /tmp/acme-monorepo/packages/$p
  printf '{ "name": "@acme/%s", "version": "2.0.0" }\n' "$p" > /tmp/acme-monorepo/packages/$p/package.json
  if [ "$p" = api ] || [ "$p" = worker ] || [ "$p" = sdk ]; then
    printf '# @acme/%s\n\nInstall:\n\n    npm install -g acme-cli@1\n    acme %s start\n' "$p" "$p" > /tmp/acme-monorepo/packages/$p/README.md
  else
    printf '# @acme/%s\n\nInstall:\n\n    npx acme@2 %s start\n' "$p" "$p" > /tmp/acme-monorepo/packages/$p/README.md
  fi
done
echo "canary workspace ready: /tmp/acme-monorepo"
