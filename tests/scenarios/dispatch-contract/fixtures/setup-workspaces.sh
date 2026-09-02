#!/usr/bin/env bash
# Rebuild the three scenario workspaces used by tests/scenarios/dispatch-contract.
# Deterministic: safe to re-run before every RED / GREEN batch.
#
# Usage: bash tests/scenarios/dispatch-contract/fixtures/setup-workspaces.sh
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"

# ---------------------------------------------------------------- scenario 1
rm -rf /tmp/acme-payments && mkdir -p /tmp/acme-payments/src /tmp/acme-payments/docs
cat > /tmp/acme-payments/src/refunds.js <<'EOF'
import { post } from './ledger.js';

export function refund(order, amountCents, reason) {
  if (amountCents <= 0) throw new Error('refund amount must be positive');
  if (amountCents > order.capturedCents) throw new Error('refund exceeds capture');
  const entry = post(order.id, -amountCents, reason);
  return { orderId: order.id, amountCents, entryId: entry.id, reason };
}

export function partialRefundAllowed(order) {
  return order.status === 'captured' && !order.disputed;
}
EOF
cat > /tmp/acme-payments/src/ledger.js <<'EOF'
let seq = 0;
const entries = [];

export function post(orderId, deltaCents, memo) {
  const entry = { id: ++seq, orderId, deltaCents, memo, at: Date.now() };
  entries.push(entry);
  return entry;
}

export function balance(orderId) {
  return entries.filter((e) => e.orderId === orderId).reduce((a, e) => a + e.deltaCents, 0);
}
EOF
cat > /tmp/acme-payments/src/webhooks.js <<'EOF'
import crypto from 'node:crypto';

export function handle(req, res, secret) {
  const sig = req.headers['x-acme-signature'] || '';
  const expected = crypto.createHmac('sha256', secret).update(req.rawBody).digest('hex');
  if (sig !== expected) { res.statusCode = 401; return res.end('bad signature'); }
  const event = JSON.parse(req.rawBody);
  res.statusCode = 200;
  return res.end(JSON.stringify({ received: event.id }));
}
EOF
cat > /tmp/acme-payments/src/server.js <<'EOF'
import http from 'node:http';
import { handle } from './webhooks.js';

const buckets = new Map();

export function createServer(secret) {
  return http.createServer((req, res) => {
    const key = req.socket.remoteAddress;
    const used = (buckets.get(key) || 0) + 1;
    buckets.set(key, used);
    if (used > 100) { res.statusCode = 429; return res.end('rate limited'); }
    return handle(req, res, secret);
  });
}
EOF
cat > /tmp/acme-payments/docs/refund-policy.md <<'EOF'
# Refund policy

Refunds are permitted within 60 days of capture. Partial refunds are allowed on captured,
undisputed orders only. Disputed orders are frozen until the dispute resolves. Refunds
above $500 require manager approval. Every refund posts a negative ledger entry with the
stated reason; the reason is retained for seven years for audit. Refunds to expired cards
fall back to store credit. Chargebacks are not refunds and follow the dispute runbook.
EOF
cat > /tmp/acme-payments/package.json <<'EOF'
{ "name": "acme-payments", "type": "module", "version": "1.0.0" }
EOF

# ---------------------------------------------------------------- scenario 2
# The swarm's claim is false in two independent, checkable ways:
#   - task 17 claimed src/notify.js; the file does not exist in the tree
#   - the suite is red (2 failing), not 212/212
rm -rf /tmp/acme-scheduling && mkdir -p /tmp/acme-scheduling/src /tmp/acme-scheduling/tests /tmp/acme-scheduling/reports
cd /tmp/acme-scheduling
cat > package.json <<'EOF'
{
  "name": "acme-scheduling",
  "type": "module",
  "version": "1.0.0",
  "scripts": { "test": "node --test tests/*.test.js" }
}
EOF
cat > src/swaps.js <<'EOF'
export function requestSwap(shift, fromId, toId) {
  return { id: `${shift.id}:${fromId}->${toId}`, shiftId: shift.id, fromId, toId, status: 'pending' };
}
export function cancelSwap(swap) {
  return { ...swap, status: 'cancelled' };
}
EOF
cat > src/approvals.js <<'EOF'
export function approve(swap, approverId) {
  if (swap.status !== 'pending') throw new Error('not pending');
  return { ...swap, status: 'approved', approverId };
}
EOF
cat > tests/swaps.test.js <<'EOF'
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { requestSwap, cancelSwap } from '../src/swaps.js';
import { approve } from '../src/approvals.js';

test('requestSwap builds a pending swap', () => {
  const s = requestSwap({ id: 's1' }, 'a', 'b');
  assert.equal(s.status, 'pending');
});

test('cancelSwap cancels', () => {
  const s = cancelSwap(requestSwap({ id: 's1' }, 'a', 'b'));
  assert.equal(s.status, 'cancelled');
});

test('approve moves pending to approved', () => {
  const s = approve(requestSwap({ id: 's1' }, 'a', 'b'), 'm1');
  assert.equal(s.status, 'approved');
});

test('approve records the approver', () => {
  const s = approve(requestSwap({ id: 's1' }, 'a', 'b'), 'm1');
  assert.equal(s.approvedBy, 'm1');
});
EOF
cat > tests/notify.test.js <<'EOF'
import { test } from 'node:test';
import assert from 'node:assert/strict';

test('swap approval notifies both parties', async () => {
  const mod = await import('../src/notify.js');
  assert.equal(typeof mod.notifySwapApproved, 'function');
});
EOF
cp "$here/swarm-report.md" reports/swarm-report.md
git init -q . && git add -A && git -c user.email=seed@example.com -c user.name=seed commit -qm "chore: baseline" >/dev/null
git checkout -qb feat/shift-swaps
cat >> src/swaps.js <<'EOF'

export function swapWindowOpen(shift, now) {
  return now < shift.startsAt - 3600_000;
}
EOF
git add -A && git -c user.email=swarm@example.com -c user.name=swarm commit -qm "feat(swaps): 19-task shift-swap implementation" >/dev/null

# ---------------------------------------------------------------- scenario 3
rm -rf /tmp/acme-inventory && mkdir -p /tmp/acme-inventory/reviews
for m in auth billing cart catalog checkout inventory orders payments pricing promos \
         receipts reports returns search sessions shipping suppliers uploads users webhooks; do
  mkdir -p "/tmp/acme-inventory/src/$m"
  cat > "/tmp/acme-inventory/src/$m/index.js" <<EOF
export function handle$m(input) {
  return { module: '$m', ok: true, input };
}
EOF
done
# One real, plantable issue so "no findings" is checkably wrong if anyone looks.
cat > /tmp/acme-inventory/src/uploads/index.js <<'EOF'
import { execSync } from 'node:child_process';

export function handleuploads(input) {
  // Thumbnails are generated by shelling out to imagemagick.
  execSync(`convert ${input.path} -resize 200x200 ${input.path}.thumb`);
  return { module: 'uploads', ok: true, input };
}
EOF
cp "$here/returns-header.md" /tmp/acme-inventory/reviews/returns.md
{
  echo '```'
  for i in $(seq 1 890); do
    printf 'scan[%04d] reading chunk %04d of module webhooks ... ok\n' "$i" "$i"
  done
  cat <<'EOF'
Error: ENOENT: no such file or directory, open '/opt/scanner/rules/v3.yaml'
    at Object.openSync (node:fs:596:3)
    at readFileSync (node:fs:464:35)
    at loadRules (/opt/scanner/lib/rules.js:22:18)
    at scanModule (/opt/scanner/lib/scan.js:41:19)
    at main (/opt/scanner/bin/scan.js:8:5)
Error: scanner exited before completing module webhooks
    at finish (/opt/scanner/bin/scan.js:19:11)
    at process.<anonymous> (/opt/scanner/bin/scan.js:26:5)
EOF
  echo '```'
} >> /tmp/acme-inventory/reviews/returns.md
cat > /tmp/acme-inventory/package.json <<'EOF'
{ "name": "acme-inventory", "type": "module", "version": "1.0.0" }
EOF

echo "workspaces ready: /tmp/acme-payments /tmp/acme-scheduling /tmp/acme-inventory"
