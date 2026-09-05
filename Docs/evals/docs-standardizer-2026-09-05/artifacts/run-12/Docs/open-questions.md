# Open Questions

Questions that require human judgment or investigation beyond the code.

- **Production SQLite driver**: `src/db.js` notes "SQLite driver (production only)" but the actual driver code is not visible. Where is the real SQLite implementation? How does the test vs. production switch work?
- **Nightly reconcile**: ADR 0001 mentions "nightly reconcile" but there is no `reconcile.js` implementation visible. Is this a future task or implemented elsewhere?
- **PORT default**: Why does the server default to port 8080 when the README and SETUP.md mention port 3000? Which should be documented as the actual default?
