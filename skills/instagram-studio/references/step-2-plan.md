# Step 2 — Plan → `plan.md`

The plan is what gets reviewed before anything is composed. Write it down;
do not carry it in your head into Step 3.

## Order of work

1. **Content type + format(s)** — from `--type` / `--format`, or inferred
   and stated. Look the numbers up in
   [formats.md](formats.md); pick the archetype in
   [content-types.md](content-types.md).
2. **Hook first.** Write the first 2 seconds (video) or slide 1 (carousel)
   before any other beat. Everything after it is built to pay it off — a
   hook retrofitted to a finished storyboard is why the middle sags.
3. **Beats or slides**, each with its on-screen text, duration, and the
   asset or UI it shows.
4. **CTA** — one, matching the content type, on the last beat/slide.

## Angle and hook ideas — optional

`soltero-skills:trend-research` can be mentioned as a source of angle or
hook ideas when the user wants options. It is never required, never blocks
this step, and nothing it returns becomes a fact — a trend is a framing, not
a claim about the product.

## `plan.md` shape

```markdown
# Plan — reel · feature-demo · 16s

## Hook (0.0–2.0s)
On screen: "Your streak survived the flu."   ← facts.md:2
Shows: app home, streak card                  ← assets/home.png

## Beat 2 (2.0–6.5s)
...

## CTA (13.0–16.0s)
On screen: "streakly.app"                     ← facts.md:1
```

Every on-screen line carries either a `facts.md:<line>` citation or a
`[CONFIRM: …]` placeholder that survives into the render as a visible
bracket. There is no third category. In particular:

- **Scope is a claim.** "half-price drafts" in the brief does not license
  "every draft on the wall". If the brief did not say how wide the offer
  is, the copy does not say it either.
- **Service promises are claims.** "we'll have taps pouring the second the
  door opens" needs a source like any number does.
- **Comparative claims are claims.** "Most habit apps guilt you" needs a
  source or it is a `[CONFIRM: …]`.
- A `[CONFIRM: …]` in the plan is fine. Quietly resolving it in your own
  favour while writing the composition is not.

## Durations and counts

Check them against [formats.md](formats.md) as you write, not after
rendering: reel/feed 7–30s with a 12–20s target, story ≤15s per file and
1–3 files, carousel 3–10 slides at ≤ ~25 words each.

When the user asks for something outside the range — a twelve-slide
carousel, a 45-second reel — quote the range, say what it costs to break it
(Instagram will not accept it, or the audience will not finish it), and plan
inside it. Splitting into a second carousel is a valid answer; twelve slides
is not.

## `--format all`

**One** plan. One hook, one narrative, one CTA. Then a separate layout
section per format:

- `reel` and `story` share the 9:16 canvas but not the safe zones; story
  splits into 1–3 files at ≤15s each.
- `feed` is re-laid out at 1080×1350 — type re-set, composition rebalanced.
  Never a crop, a letterbox, or a scale of the reel.
- `carousel` re-expresses the same beats as 3–10 stills.

## Gate

Every duration and count inside its format's range · every on-screen line
cites a `facts.md` line or is a visible `[CONFIRM: …]` · hook written first
· one CTA.
