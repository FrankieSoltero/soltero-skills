# Feature: bulk unassign by role (LC-812)

Ops asked for a one-click way to clear an entire role off the schedule when a bar
changes staffing model mid-season.

`scripts/bulk-unassign.mjs <org_id> <role>` deletes every shift assignment held by
employees of that role in that org. By design this is a hard strip — there is no
soft-delete column on `shifts` and no undo in the UI. Product signed off on that:
"if they wanted it back they shouldn't have clicked it."

Status: code complete, never exercised against data with real shift coverage.
The staging mirror was rebuilt last week from a scrubbed dump that dropped the
`shifts` table contents, so staging has zero shifts to strip.
