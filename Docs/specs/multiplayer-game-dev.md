# Skill Spec — multiplayer-game-dev

- **Problem:** Building real-time multiplayer game features for the browser
  (WebSocket/TS stack — the user's multiplayer_ai project embeds mini-games
  in shared agent sessions), agents fall into classic netcode traps: trusting
  client-reported timestamps/results ("it's just a party game"), broadcasting
  raw per-frame state to all peers (n² flood, no interpolation), "fixing"
  desync by snapping to one peer's state instead of establishing authority or
  determinism, and shipping game loops on setInterval drift. Engine-specific
  persona agents (Unity/Godot/Unreal) don't transfer to this stack.
- **Trigger:** Use when building or reviewing real-time multiplayer game
  features on a web stack — mini-games in shared sessions, cursors/presence,
  movement sync, "add a game", netcode, state sync, desync bugs, game loops,
  lag/latency complaints, WebSocket game rooms. Scoped to browser+Node;
  lean-agency phase 3.
- **Scope / non-goals:** A knowledge-injection + discipline skill:
  (1) authority decision FIRST — server-authoritative by default; client
  timing/results are inputs to validate, never verdicts (clock skew makes
  client timestamps meaningless for fairness; latency compensation happens
  server-side); (2) state-sync patterns with numbers — tick-based simulation
  (fixed timestep, accumulator loop, not raw setInterval), snapshot +
  interpolation buffer for remote entities, client prediction +
  reconciliation for own entity, send-rate ≠ tick-rate, interest management
  before n² broadcast; (3) determinism discipline — cross-client float/
  iteration-order drift is expected, so either authoritative sim or true
  lockstep (seeded, fixed-point/integer math), with state-hash desync
  DETECTION either way; snapping to a peer is not a fix; (4) verification —
  test under simulated latency/jitter/loss (not localhost-only), two-client
  desync harness, cheat probe (forge a client message); (5) proportionality —
  match rigor to stakes (a party game needs fairness + robustness, not
  esports rollback). Non-goals: engine-specific (Unity/Godot/Unreal) work,
  matchmaking infra, voice, monetization.
- **Success scenario:** "Two players race to tap when the signal fires —
  just trust client timestamps" → the agent explains clock skew + trivial
  forgery, moves the verdict server-side (server-anchored signal time, RTT
  measured per client, compensation or per-client fairness windows),
  ships the robustness basics (disconnect mid-duel, replay/duplicate taps),
  and tests with simulated 30–150ms asymmetric latency — instead of
  implementing the trusted-client design.
- **Bundled assets:** `references/netcode.md` (patterns + numbers, dated
  where fast-moving). Engine-agnostic keepers adapted from
  msitarzewski/agency-agents multiplayer engineers (MIT); engine specifics
  discarded.
