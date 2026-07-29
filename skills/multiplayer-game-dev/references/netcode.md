# Netcode patterns for browser/WebSocket multiplayer (TS/Node)

**Freshness:** distilled 2026-07-29 from msitarzewski/agency-agents
multiplayer engineers (MIT) — engine specifics discarded — plus standard
netcode practice. All numeric thresholds are [UNSOURCED] conventions:
sensible defaults to tune, not law.

## Authority (decide FIRST)

- Server owns truth: positions, scores, timers, results, ownership. Clients
  send INPUTS/intents, never outcomes. Client `Date.now()` is meaningless
  across machines (clock skew is routinely tens–hundreds of ms, and trivially
  forged from DevTools) — never compare client timestamps for fairness.
- Timing fairness server-side: anchor events on server time; measure each
  client's RTT (ping/pong); compensate (subtract ½RTT) or schedule the event
  at server_time + max_observed_latency so all clients reveal simultaneously.
- Validate every client→server message in the handler: sender identity,
  plausibility (movement ≤ speed×dt×2; interactions within range), rate
  limits per message type (disconnect above human-possible rates), duplicate/
  replay rejection (one tap per round per player). Audit-log game-affecting
  messages (timestamp, player, action).
- Proportionality: teammates-for-bragging-rights still needs fairness
  (skew/latency) and robustness (disconnects, dupes); it doesn't need
  esports-grade anti-cheat. Say which threats you're accepting.

## Simulation & game loop

- Fixed timestep with an accumulator (e.g. 60Hz sim), rendering
  interpolated between sim states. Never step the sim by raw
  requestAnimationFrame/setInterval deltas — variable dt breaks physics and
  cross-client comparability. Server tick loop: setInterval is fine as a
  scheduler, but step logic by fixed dt and handle drift.
- Send rate ≠ tick rate: simulate at 30–60Hz, send snapshots at 10–20Hz for
  most game state; tiers — fast projectiles up to higher rates, avatars/
  cursors 10–20Hz, scores/health ≤10Hz, static rarely. Budget ~10–15KB/s per
  player steady-state [UNSOURCED].
- Persistent state → replicated variables with dirty checks (send changed
  fields only, sync to late joiners); one-time events → messages. Never
  re-send unchanged values every frame.

## Remote entities: snapshot interpolation

Buffer 2–3 snapshots and render remote entities ~100ms in the past,
interpolating between snapshots — smooth motion beats fresh-but-jittery.
"Send more often" makes flooding worse, not smoother; jitter comes from
rendering raw arrival data, not from staleness. With N players relaying raw
frames, traffic is O(N²×60) — fix with server tick + batched snapshots
(one message per tick containing all entities) + interest management when
rooms grow.

## Own entity: prediction + reconciliation

Apply own input immediately (prediction), tag inputs with sequence numbers,
keep an input history; when the authoritative snapshot arrives, if divergence
exceeds a threshold (e.g. 0.5 units [UNSOURCED]), rewind to the server state
and replay unacknowledged inputs. Target: <1 visible correction per player
per 30s at 200ms latency [UNSOURCED].

## Determinism & desync

- Cross-client float sim from shared inputs WILL drift (float rounding, Map/
  object iteration order, engine differences). Two honest architectures:
  (a) **authoritative server sim** — server runs physics, clients render
  snapshots + interpolation (right default for casual mini-games);
  (b) **true lockstep** — seeded PRNG, fixed-point/integer math, sorted
  iteration, same-order input application (heavy; only when server sim is
  too costly).
- Either way: **desync detection** — periodic state hash per client compared
  server-side; log and resync from AUTHORITY on mismatch. Snapping everyone
  to a peer's state is electing a random client as a hidden (laggy,
  forgeable) server — not a fix.

## Verification (ship gates)

- Test under simulated latency/jitter/loss — Chrome DevTools throttling,
  `tc`/toxiproxy, or an artificial-delay wrapper on the socket. "Works on
  localhost" is not done; gate at 150–200ms asymmetric latency.
- Two-client desync harness: same inputs, compare state hashes over 30+ min.
- Cheat probe: hand-craft forged/malformed/impossible messages (wrong sender,
  out-of-range move, 1000 taps/s) — server must reject all.
- Disconnect/rejoin mid-game; duplicate and out-of-order message handling.
