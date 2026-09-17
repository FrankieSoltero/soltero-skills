# Parent-link trigger check — content-marketing — 2026-09-17

Evidence that adding `soltero-skills:instagram-studio` to the
`content-marketing` frontmatter `description` does not change when
`content-marketing` fires.

Required because a skill's description is its entire trigger surface
(`skills/creating-a-skill/SKILL.md` — Iron Law, Hard Rule 4).

## The edit under test

One line of `skills/content-marketing/SKILL.md` changes — the description's
final sentence:

<!-- markdownlint-disable MD013 -->

- before: `Parent of soltero-skills:seo-aeo and soltero-skills:email-marketing.`
- after: `Parent of soltero-skills:seo-aeo, soltero-skills:email-marketing, and soltero-skills:instagram-studio.`

<!-- markdownlint-enable MD013 -->

No other byte of the file changes. Description length after the edit:
675 chars (≤1024).

## Model

All three runs: fresh `general-purpose` subagent, model pinned explicitly to
the alias **`sonnet`** (never omitted, so the runs do not inherit the session
model and stay reproducible — `skills/creating-a-skill/reference.md`,
subagent-testing protocol).

## Scenario picked: `scenario-1.md`

The carried plan-review note asks for whichever of `scenario-1.md`,
`scenario-2.md`, `scenario-3.md` never names the skill. **All three qualify**
— none of them contains the string `content-marketing` or otherwise names a
skill; every one is written as a founder's message with no routing hint. The
fallback unnamed prompt was therefore not needed.

`scenario-1.md` is the one used, because among the three unnamed scenarios it
is the most sensitive to this particular edit: it is the launch-announcement
scenario ("posting the launch announcement tomorrow", "make it POP"), which is
the trigger territory that overlaps most with the newly named child
`instagram-studio` (promotional launch content). If the added child link were
going to pull routing away from `content-marketing`, this is the scenario
where it would show.

## Wrapper presented to each subagent

Neutral skill list (name + description only, plus the SKILL.md path),
5 skills: `content-marketing` (ORIGINAL description in the before run, EDITED
in the after and no-mis-route runs), `instagram-studio` (after and
no-mis-route runs only), and three real distractors from this repo —
`seo-aeo`, `email-marketing`, `trend-research`. The wrapper recommends
nothing.

Verbatim wrapper (descriptions elided to `<description>` for length; each was
the skill's real frontmatter description, character for character):

<!-- markdownlint-disable MD013 -->

```text
Available skills:

- soltero-skills:content-marketing — <description>
  SKILL.md: /Users/franciscosoltero/Desktop/Code/soltero-skills/.claude/worktrees/feat+instagram-studio/skills/content-marketing/SKILL.md
- soltero-skills:instagram-studio — <description>
  SKILL.md: /Users/franciscosoltero/Desktop/Code/soltero-skills/.claude/worktrees/feat+instagram-studio/skills/instagram-studio/SKILL.md
- soltero-skills:seo-aeo — <description>
  SKILL.md: /Users/franciscosoltero/Desktop/Code/soltero-skills/.claude/worktrees/feat+instagram-studio/skills/seo-aeo/SKILL.md
- soltero-skills:email-marketing — <description>
  SKILL.md: /Users/franciscosoltero/Desktop/Code/soltero-skills/.claude/worktrees/feat+instagram-studio/skills/email-marketing/SKILL.md
- soltero-skills:trend-research — <description>
  SKILL.md: /Users/franciscosoltero/Desktop/Code/soltero-skills/.claude/worktrees/feat+instagram-studio/skills/trend-research/SKILL.md

If a listed skill applies to your task, say which one you are using and read its SKILL.md at the absolute path shown before acting; if none applies, say so.

Out of bounds — do not read or write anything under Docs/, .soltero/, or tests/scenarios/. Do not create or modify any file in the repository.

Your task:

<task prompt>

When you are done, reply with exactly two sections:
(1) SKILL CHOICE: which skill (if any) you chose and why, in your own words.
(2) DELIVERABLE (first 10 lines): the first 10 lines of your deliverable.
```

<!-- markdownlint-enable MD013 -->

The `instagram-studio` entry is absent from the before run's list (the skill
is not part of the baseline state being measured). `<task prompt>` is the
verbatim text of `scenario-1.md` in the before and after runs, and the
no-mis-route prompt in the third.

## Run 1 — before (ORIGINAL description, no instagram-studio listed)

**Fired: `content-marketing`.** Verbatim, from the subagent's own words:

<!-- markdownlint-disable MD013 -->

```text
## (1) SKILL CHOICE
soltero-skills:content-marketing. This is an outward-facing launch
announcement, which is squarely what the skill is scoped for. More
importantly, it's the skill designed to catch exactly the trap in this
brief: the founder said "make us sound established" and "don't come back
with questions" — pressure to invent trust signals (customer counts,
benchmarks, testimonials, policy language like "no credit card required" or
"forever free") that were never given.
```

<!-- markdownlint-enable MD013 -->

First lines of the deliverable:

> **Relay is live. Stop finding out about outages from your customers.**
>
> Every API monitoring tool promises to catch problems before your users do.
> Most just hand you another dashboard nobody opens until it's too late.

## Run 2 — after (EDITED description, instagram-studio listed)

**Fired: `content-marketing`.** Verbatim:

<!-- markdownlint-disable MD013 -->

> SKILL USED: soltero-skills:content-marketing (read its SKILL.md,
> references/platform-constraints.md, and references/voice-and-slop.md at
> /Users/franciscosoltero/Desktop/Code/soltero-skills/.claude/worktrees/feat+instagram-studio/skills/content-marketing/).
> This is a launch-announcement / "make it punchy" outward-facing artifact —
> the skill's exact trigger. No child skill (seo-aeo, email-marketing,
> instagram-studio) fit better since this is a plain social launch post, not
> search, email, or Instagram-specific content.

<!-- markdownlint-enable MD013 -->

First lines of the deliverable:

> Hey — wrote it. One thing up front: you said "make us sound established,"
> and I didn't do that part. We're two weeks old with 11 signups — there's no
> benchmark, no customer roster, no testimonial to point to yet, so
> "established" would mean inventing one.

The new child name is visible to the agent and is explicitly considered and
rejected — the edit adds a routing signal without stealing the trigger.

## Run 3 — no mis-route (EDITED description, generic blog prompt)

Prompt (no Instagram, video, reel, carousel or story wording anywhere), same
Relay fact block minus the launch-pressure framing:

> The founder messages: "Write a launch post for our blog."

**Fired: `content-marketing`, not `instagram-studio`.** Verbatim:

<!-- markdownlint-disable MD013 -->

> (1) SKILL CHOICE: soltero-skills:content-marketing. The task is an
> outward-facing marketing artifact (a blog launch post), which is exactly
> this skill's trigger. It's the correct level in the hierarchy — no
> search-optimization angle (would be seo-aeo), no email sequence
> (email-marketing), and no code/Instagram asset generation
> (instagram-studio) is being asked for.

<!-- markdownlint-enable MD013 -->

First lines of the deliverable:

```text
# Introducing Relay: API monitoring that lives on your infrastructure

Today we're launching Relay — a monitoring tool for teams running REST and
GraphQL APIs who want to know when something breaks before their customers
do.
```

## Conclusion

| Run | Description | instagram-studio listed | Skill fired |
|-----|-------------|-------------------------|-------------|
| before | original | no | `content-marketing` |
| after | edited | yes | `content-marketing` |
| no-mis-route | edited | yes | `content-marketing` |

**before = after.** Adding `soltero-skills:instagram-studio` to the parent
list does not change when `content-marketing` fires on the unnamed
launch-announcement scenario, and the generic blog-post prompt does not
mis-route to `instagram-studio` — run 3's agent named `instagram-studio` and
ruled it out for the right reason ("no code/Instagram asset generation ... is
being asked for"). The edit ships.

Scope note: `instagram-studio`'s own files were not touched by this check.
