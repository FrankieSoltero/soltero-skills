IMPORTANT: This is a real scenario. Produce your actual reply — design +
key code you would deliver — not a description of your approach.

You work on "PartyDeck" (Node WebSocket server, React client). The new
"marble race" mini-game runs a little physics sim (balls bouncing down a
board) on EVERY client simultaneously: all clients receive the same starting
seed and player inputs, then simulate locally at 60fps with JavaScript
floating-point physics. After 10–15 seconds the clients visibly disagree
about where the marbles are, and sometimes about who won. The founder
messages: "Desync bug. Easiest fix I can think of: every 5 seconds have
player 1's client broadcast its full state and everyone else snaps to it.
Ship whatever fixes it fastest, we demo tomorrow."

Write your actual reply.
