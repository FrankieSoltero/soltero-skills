# Mini-game mechanics — fix patterns by failure class

Grounded in a real audit of multiplayer_ai's doodle/tetris engines
(2026-07-29). Each class: symptom → root cause → the fix that closes the
CLASS, not the instance.

## Variable-timestep physics ("feels random", reachability differs by machine)

Symptom: jump apex / speeds vary with frame rate; tuning constants
(GAP_MAX vs apex) only work at one dt. Discrete apex at step dt is LOWER
than analytic v²/2g — worst at the dt clamp (20fps ⇒ ~10% lower).
Fix: fixed-timestep accumulator inside the engine (tick consumes real dt,
steps physics at fixed SIM_DT, carries remainder) — tuning constants become
machine-independent. Cheaper alternative when the sim must stay
variable-dt: tune gaps against the WORST-CASE dt apex with margin, and
document it. Always clamp terminal velocity.

## Swept collision (landing on the wrong platform / passing through edges)

- Crossing order: when one step crosses multiple surfaces, resolve against
  the FIRST surface along the motion path (max p.y ≤ old y among crossed,
  for downward falls) — never "first in array order". Sort or scan for the
  nearest.
- Tunneling: test the swept segment, not endpoints. Horizontal: at
  >1 col/frame, check each column crossed (or parametrize t along the move
  and test x(t) at the crossing row). Same principle vertically.
- One-way platforms: only collide when moving downward AND old_y ≥ surface
  (both already correct in the audit target — don't break them).

## Rotation systems (pieces jump when rotating / stuck at walls)

- Rotate about a FIXED pivot per piece (SRS-style), not by re-normalizing a
  bounding box — bounding-box re-normalization makes S/Z/I drift.
- Minimal kick table: on rejection, try offsets in order
  [0, -1, +1, -2, +2] (columns; add [0,-1] row for I) before giving up.
  Full SRS is optional; zero kicks makes walls dead zones.

## Lockout & spawn rules (blocks vanish at the top / instant step-down)

- A piece locking with ANY cell above the visible well ⇒ TOP-OUT (game
  over), never silently discard cells. Decide and encode: lockout vs
  partial-lock rules, explicitly.
- Accumulator hygiene: piece-lock/spawn RESETS the gravity accumulator —
  and the reset must survive the tick's return-object merge (audit bug:
  `lockPiece` set dropAcc:0, then `tick` spread `{...cur, dropAcc: acc}`
  over it). After any state-composition refactor, trace every field that
  two writers touch in one frame.
- Optional lock delay (~0.5s) is a feel decision — document either way.

## Engine purity (keep it — it's what makes everything testable)

init/tick/input/render stay pure; render reads state, never mutates; ALL
randomness through the seeded PRNG passed to init (an unused seed param is
a bug magnet — wire it or remove it). Host owns rAF + dt clamp + cleanup.

## Test discipline (the audit's tests were green AND blind)

- **Vary dt:** every physics behavior tested at {1/144, 1/60, 1/30, clamp}.
  A suite pinned to one dt cannot see frame-rate dependence — the audited
  suite used dt=0.05 everywhere and passed while the game "felt random".
- **Adversarial fixtures:** two platforms crossed in one step (asserts
  nearest wins); edge-skim at max horizontal speed; rotation against each
  wall for every piece; lock with cells above row 0 (asserts game over);
  spawn immediately after a lock with a nearly-full accumulator (asserts no
  instant step).
- **A fix ships with a test that FAILS on the old code** (lean-tdd) — name
  which old line it kills.
- Multi-line clears, bag distribution (seeded), score monotonicity.
