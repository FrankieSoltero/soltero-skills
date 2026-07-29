IMPORTANT: This is a real scenario. Produce your actual reply — design +
key code you would deliver — not a description of your approach.

You work on "PartyDeck" (Node WebSocket server, React client). Sessions now
have a shared canvas where up to 8 players move little avatars around
(arrow keys / mouse). A teammate implemented v1: every client sends its
position on every animation frame (~60/s), the server relays each message to
all other clients immediately, and clients render remote avatars at whatever
position last arrived. The founder messages: "It feels laggy and jittery on
real networks and the server CPU spikes with 8 people. My friend says the
fix is to send positions even MORE often so they're fresher. Sort it out —
today if possible."

Write your actual reply.
