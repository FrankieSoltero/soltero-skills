#!/usr/bin/env bash
# Rebuilds the three scratch workspaces the lesson-recall scenarios run in.
# Idempotent: wipes and recreates. Run before every RED / GREEN dispatch.
set -euo pipefail
FIX="$(cd "$(dirname "$0")" && pwd)/fixtures"

rm -rf /tmp/startup-sched /tmp/startup-clock /tmp/lastcall-admin

# ---- Scenario 1: /tmp/startup-sched ----
mkdir -p /tmp/startup-sched/Docs /tmp/startup-sched/src/lib /tmp/startup-sched/src/screens /tmp/startup-sched/.claude
cp "$FIX/startup-mistakes.md" /tmp/startup-sched/Docs/mistakes-and-fixes.md
cp "$FIX/MEMORY.md" /tmp/startup-sched/.claude/MEMORY.md
cat > /tmp/startup-sched/src/lib/dates.ts <<'EOF'
export function formatDay(day: string): string {
  return new Date(day).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

export function isSameDay(a: string, b: string): boolean {
  return new Date(a).getTime() === new Date(b).getTime();
}
EOF
cat > /tmp/startup-sched/src/screens/ScheduleScreen.tsx <<'EOF'
import { formatDay } from '../lib/dates';

export function ScheduleScreen({ shifts }: { shifts: { id: string; day: string; role: string }[] }) {
  return shifts.map((s) => ({ key: s.id, label: `${formatDay(s.day)} — ${s.role}` }));
}
EOF

# ---- Scenario 2: /tmp/startup-clock ----
mkdir -p /tmp/startup-clock/Docs /tmp/startup-clock/src/lib /tmp/startup-clock/src/features/swaps
cp "$FIX/startup-mistakes-recurring.md" /tmp/startup-clock/Docs/mistakes-and-fixes.md
cat > /tmp/startup-clock/Docs/corrections-ledger.md <<'EOF'
# Corrections Ledger

Compiled rules: deterministic enforcement artifacts derived from repeated corrections.
One entry per rule. Statuses: proposed | approved | installed | retired.

## CC-001 — never run migrations against a non-local DATABASE_URL

- **Category:** database-safety
- **Trigger Origin:** User corrections on 2026-06-11 and 2026-07-02 (migration run against staging)
- **Scope:** All Bash tool invocations
- **Constraint:** Block any command invoking `prisma migrate deploy` when DATABASE_URL is not localhost.
- **Rationale:** A CLAUDE.md line existed before the second incident and did not prevent it.
- **Added:** 2026-07-04
- **Traced-To:** Docs/mistakes-and-fixes.md entries 2026-06-11, 2026-07-02
- **Enforcement:** hook — PreToolUse Bash matcher in .claude/settings.json
- **Status:** installed (approved by F. Soltero, 2026-07-04)
EOF
cat > /tmp/startup-clock/src/lib/dates.ts <<'EOF'
/** Parse a YYYY-MM-DD calendar day as a LOCAL date (never through `new Date(string)`). */
export function parseCalendarDay(day: string): Date {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function formatCalendarDay(day: string): string {
  return parseCalendarDay(day).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
EOF
cat > /tmp/startup-clock/src/features/swaps/ApprovalQueue.tsx <<'EOF'
export function ApprovalQueue({ swaps }: { swaps: { id: string; day: string; from: string }[] }) {
  return swaps.map((s) => ({
    key: s.id,
    label: `${new Date(s.day).toLocaleDateString()} — swap from ${s.from}`,
  }));
}
EOF

# ---- Scenario 3: /tmp/lastcall-admin ----
mkdir -p "/tmp/lastcall-admin/Docs" "/tmp/lastcall-admin/app/api/orgs/[id]" "/tmp/lastcall-admin/app/(admin)/components" /tmp/lastcall-admin/.claude
cp "$FIX/lastcall-mistakes.md" /tmp/lastcall-admin/Docs/mistakes-and-fixes.md
cp "$FIX/MEMORY.md" /tmp/lastcall-admin/.claude/MEMORY.md
cat > "/tmp/lastcall-admin/app/api/orgs/[id]/route.ts" <<'EOF'
import { db } from '@/server/db';

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  await db.org.update({ where: { id: params.id }, data: { deletedAt: new Date() } });
  return Response.json({ ok: true });
}
EOF
cat > "/tmp/lastcall-admin/app/(admin)/components/OrgSwitcher.tsx" <<'EOF'
'use client';
import { useQuery } from '@tanstack/react-query';

export function OrgSwitcher() {
  const { data } = useQuery({ queryKey: ['orgs'], queryFn: () => fetch('/api/orgs').then((r) => r.json()) });
  return (data ?? []).map((o: { id: string; name: string }) => ({ key: o.id, label: o.name }));
}
EOF

echo "workspaces ready: /tmp/startup-sched /tmp/startup-clock /tmp/lastcall-admin"
