# Notes

> Legacy single-file notes (kept for history — this is `doc/`, singular, a different
> directory from `docs/`). Both facts below are now also captured, with more context, in
> `AGENTS.md` and `docs/ARCHITECTURE.md`. Add new notes under `docs/`, not here, so we stop
> accumulating a second docs directory.

- Rounding: every amount is stored in integer cents. `roundHalfEven` in
  `src/ledger/rounding.js` is the ONLY rounding function allowed in posting code; a naive
  `Math.round` caused the Feb drift incident.
- Plugins under `src/plugins/` are picked up by filename at boot; there is no registration list.
