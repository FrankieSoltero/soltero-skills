---
name: lean-debugging
description: Use for any bug, test failure, or unexpected behavior, before proposing a fix — especially under time pressure, after a fix that didn't stick, or when a "quick patch" looks obvious. Root cause before fixes, one change at a time, symptom patches never ship (not even as "insurance" or a "fallback" when time runs out — the honest fast path is a revert), and three failed fixes means stop and question the architecture. Lean, time-boxed variant of the systematic-debugging discipline.
---

# Lean Debugging

## Overview

**Find the root cause before attempting fixes.** Symptom fixes convert loud,
monitored failures into silent wrong behavior — and leave the defect for
every downstream consumer.

## The Iron Law

```
NO FIX WITHOUT ROOT CAUSE — AND NO SYMPTOM PATCH AS A "FALLBACK"
```

The second clause is where cheap-tier agents slip: they investigate
properly, run out of time, and then ship the patch they correctly rejected —
relabeled "insurance." When the clock runs out, the honest fast exits are a
**revert of the guilty change** (provably the pre-bug behavior, keeps the
error signal trustworthy) or an **honest escalation** — never the mask.

## The Loop

1. **Investigate.** Read the whole error (stack, line, code — it often names
   the answer). Reproduce it. Check what changed (git log/diff, deps,
   config) — recent changes are the prime suspects and a revert of the
   guilty one is a legitimate fix. Trace the bad value to where it
   ORIGINATES, not where it crashes. In multi-component systems (workflow →
   build → sign; API → service → DB), instrument each boundary
   (present/absent, shape — never secret values), run ONCE, and read which
   hand-off fails before touching anything.
2. **Hypothesize — one, named.** "X is the root cause because Y." If you
   can't say it, you're not done investigating.
3. **Test minimally.** Smallest change that confirms or kills the
   hypothesis. One variable. Didn't confirm? New hypothesis — don't stack
   fixes.
4. **Fix at the source, test-first.** Failing test reproducing the bug
   (lean-tdd), then the fix, then verify (lean-verification): the
   reproducing case passes, nothing else broke.

## The Three-Fix Breaker

Count your fix attempts. At **three failed fixes — STOP dispatching fixes.**
Each fix relocating the symptom to a new place (cart → payment → email →
inventory) is the signature of an architectural problem (usually shared
state with no owner). Fix #4 is not converging; it's the next relocation.
Write the pattern up (table of fix → result), name the structural cause, and
raise it with your human partner before any further attempt. Containment
(alert + manual reconciliation) is allowed if labeled as containment.

## Red Flags — STOP

- "Quick fix for now, investigate later" / "ship the patch as insurance"
- Multiple changes in one attempt; a fix stacked on a failed fix
- Proposing solutions before tracing where the bad value originates
- "One more fix attempt" when two-plus have already failed

| Excuse | Reality |
|--------|---------|
| "No time for root cause" | Identifying the guilty change IS the fast path — and a revert is faster than a patch. |
| "The patch provably stops the crash" | It converts a monitored crash into silent wrong data for every consumer. |
| "It's probably X" | Seeing a symptom ≠ understanding the cause. Test the hypothesis minimally. |
| "Fix #4 is well-reasoned" | So were 1–3. Three relocations = architecture. Escalate. |

---

*Derived from superpowers:systematic-debugging (MIT, © 2025 Jesse Vincent),
condensed; adds the no-patch-as-fallback clause observed in cheap-tier
baselines and the revert-as-honest-exit rule.*
