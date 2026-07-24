---
name: prd-success-metrics
description: Use when writing or reviewing a PRD's success-metrics / goals section, or on standalone asks like "define success metrics for X" or "how do we know this worked?" — converts vague goals into 3–5 primary metrics that each carry baseline, target, timeframe, and measurement source, with every unsourced number marked "proposed — confirm" instead of presented as fact, and instrumentation asked about rather than assumed. Child skill of soltero-skills:writing-prds (which invokes it for section 7).
---

# PRD Success Metrics

## Overview

Given vague goals ("better UX", "more engagement") and a deadline, the observed default
is confident fabrication: precise targets ("90% within 7 days", "40% WAU/MAU"), owners
("Product Analytics"), and instrumentation (funnels, surveys, ticket tagging) invented
wholesale and presented as fact — across a sprawl of a dozen-plus metrics so success is
never falsifiable. Notably, the default resists fabrication when someone *names* the trap
("just make up numbers"); it fails on the plain everyday ask. This skill applies the same
discipline to the everyday ask.

## The Rules

1. **Four parts per metric, no exceptions:** **baseline** (current value, or explicitly
   "unknown — measure first", which becomes a pre-launch instrumentation task) ·
   **target** · **timeframe** · **measurement source** (the specific table, query,
   event, or tool producing the number).
2. **Every number is sourced or proposed.** A target the user didn't give you is
   written `(proposed — confirm)` — in the metric row itself, not in a footnote. Same
   for owners and cadences. Never deliver invented specifics as settled fact, however
   confident the formatting.
3. **Ask about instrumentation before naming it.** One question — "what measurement do
   you actually have today (analytics tool, DB tables, support-ticket tags)?" — before
   the section is written. If delivery is forced without an answer, the section LEADS
   with an assumptions block listing every measurement source it presumes.
4. **Cap: 3–5 primary metrics.** Primary = the launch is judged on them. Everything
   else goes to a short optional/secondary list or gets cut. A goal with 4–5 co-equal
   metrics has no success criterion.
5. **One guardrail minimum** — the thing that must NOT get worse (support volume,
   latency, churn) — with the same four parts.

## Quick Reference

| Smell in your draft | Fix |
|---|---|
| "Target: 90%" and the user never said 90% | `Target: 90% (proposed — confirm)` |
| Owner column full of teams nobody mentioned | Ask who owns measurement, or mark proposed |
| "Measured via funnel analytics" — does that exist? | Ask; else list under leading assumptions |
| 10+ metrics | Pick 3–5 primary; demote or delete the rest |
| Goal restated as a metric ("engagement up") | Add the four parts or drop it |

## Rationalization Table

| Excuse | Reality |
|--------|---------|
| "The doc is due today; reasonable defaults beat a delay." | One instrumentation question costs minutes. Fabricated targets cost a quarter of chasing numbers nobody chose. |
| "Industry benchmarks make my invented target defensible." | A benchmark is a citation for a *proposed* target — label it proposed, cite it, confirm it. |
| "More metrics = more thorough." | More metrics = unfalsifiable. 3–5 primary or it isn't a success section. |
| "I put 'to be validated' at the bottom, so the numbers are safe." | Nobody reads the bottom. Proposed-markers go in the row, assumptions go on top. |

## Red Flags — STOP

- A number in your table has no source and no `(proposed — confirm)` marker.
- You've named a tool, event, or team you were never told exists.
- You're past five primary metrics and still adding.
- You haven't asked a single question and the section looks finished.
