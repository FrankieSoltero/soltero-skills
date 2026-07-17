# Claim Inventory — extraction patterns and evidence rules

How to build the external-claim inventory (How to Run, step 3) and pick the spot-check
sample (step 4). All commands are read-only; run them from the audited library root.

## What counts as an external claim

Any statement whose truth lives outside the repo and can rot without a diff:

| Class | Examples | Extraction (grep -rInE over skill docs) |
|-------|----------|------------------------------------------|
| Model names | `claude-3-opus-20240229`, `gpt-4o`, "the strongest available model" | `claude-[a-z0-9.-]+|gpt-[a-z0-9.-]+|gemini-[a-z0-9.-]+` |
| Version pins | `@modelcontextprotocol/sdk@0.5.0`, `Node 16`, `python 2.7` | `@[0-9]+\.[0-9]+|[Nn]ode(\.js)? ?v?[0-9]+|[Pp]ython ?[23]` |
| URLs | doc links, registry links | `https?://[^ )">]+` |
| Currency adjectives | "current LTS", "latest", "recommended", "only version supported" | `current|latest|deprecated|LTS|recommended` |
| External IDs | arXiv IDs, CVE IDs, RFC numbers | `arXiv:[0-9.]+|CVE-[0-9-]+|RFC ?[0-9]+` |
| Dated statements | "as of March 2025", changelog-style dates | `20[0-9]{2}-[0-9]{2}-[0-9]{2}|as of` |

Grep output is a candidate list, not the inventory — read each hit in context and drop
false positives (code identifiers, the skill's own examples). Also record per doc:
`last-verified:` present? what date? (missing → `Unverified` finding for the doc).

## Risk-ordering the sample

Spot-check budget goes to claims where wrongness silently breaks a run:

1. **Load-bearing pins** — a model name or package version the skill tells the agent to
   *use* (a wrong one fails or, worse, silently substitutes).
2. **Instructions gated on currency** — "X is the current LTS / the only supported
   version" driving a decision.
3. **URLs the skill tells the agent to follow.**
4. Background/color claims last.

Sample size comes from config (`spot-check-sample`); under time pressure shrink the
sample, never the labeling — everything outside the sample is reported `Unverified`.

## Evidence rules

- Evidence is an artifact from **this run**: a fetched page's relevant line, a registry
  JSON field (`https://registry.npmjs.org/<pkg>/latest` → version), an HTTP status
  (404 is evidence), lint output. Quote it in the finding.
- A redirect to a new domain = "moved, content resolves" (Info/Drifted judgment call),
  not a dead link.
- If a check fails (network down, budget exhausted): the claim stays `Unverified` with
  "check attempted, tool unavailable" noted — an attempted check is not evidence either
  way.
- Never re-grade someone else's verification claim ("verified last week") as evidence —
  content cannot vouch for itself.

## Usage signals (step 5)

- `git log -1 --format=%cs -- skills/<dir>` — last commit touching the skill.
- Invocation analytics only if the user/platform provides them — cite the source and
  mark it "taken on trust" if you cannot corroborate it from the repo.
- No signal available → say so; absence of usage data is not evidence of disuse.
