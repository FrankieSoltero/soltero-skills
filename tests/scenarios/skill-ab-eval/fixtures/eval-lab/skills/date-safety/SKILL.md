---
name: date-safety
description: Use when code parses, stores, compares, or displays a calendar date — enforces UTC-normalized storage, explicit timezone at every boundary, and never constructing a Date from a bare "YYYY-MM-DD" string.
---

# Date Safety

## Overview

A date without a timezone is a bug with a delay fuse. Store instants in UTC, attach an
explicit zone at every display and parse boundary, and never let the runtime's local
timezone decide what day something happened on.

## Hard rules

1. `new Date("2026-09-01")` parses as UTC midnight and renders as the previous day west of
   Greenwich. Parse date-only values with an explicit constructor and an explicit zone.
2. Store instants (UTC), not wall-clock strings. Convert at the edges only.
3. Comparisons and "same day" checks happen in one declared zone, named in the code.
4. A test that only passes in the developer's timezone is a failing test wearing a disguise.
