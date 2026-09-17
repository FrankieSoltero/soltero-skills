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
Place: x 80–960 · y 980–1320
Shows: app home, streak card                  ← assets/home.png

## Beat 2 (2.0–6.5s)
...

## CTA (13.0–16.0s)
On screen: "streakly.app"                     ← facts.md:1
Place: x 80–960 · y 1180–1420
```

**Every on-screen text block in a `reel`, `story` or `feed` plan carries a
`Place:` line — an x-range and a y-range in canvas pixels, inside that
format's safe-zone bounds in [formats.md](formats.md).** Planning the
placement is what makes the bounds checkable before anything is composed;
Step 3 then measures the rendered frame. Carousel slides have no platform
UI over them and therefore no safe-zone bands — place their text by
composition alone and do not invent bands for them.

Every on-screen line carries either a `facts.md:<n>` citation — **`<n>` is
the numbered item in `facts.md`, not the file's line number** (see
[step-1-source.md](step-1-source.md)) — or a `[CONFIRM: …]` placeholder that
survives into the render as a visible bracket. There is no third category.
In particular:

- **Scope is a claim.** "half-price drafts" in the brief does not license
  "every draft on the wall". If the brief did not say how wide the offer
  is, the copy does not say it either.
- **Service promises are claims.** "we'll have taps pouring the second the
  door opens" needs a source like any number does.
- **Comparative claims are claims.** "Most habit apps guilt you" needs a
  source or it is a `[CONFIRM: …]`.
- **A `[CONFIRM: public?]`-marked `facts.md` line is not a usable
  citation.** It is sourced but not cleared for publication, so on-screen
  copy citing it stays a visible `[CONFIRM: …]` until the user resolves the
  mark.
- A `[CONFIRM: …]` in the plan is fine. Quietly resolving it in your own
  favour while writing the composition is not.

**A claim is not only text.** What a beat *shows* is a claim too: a depicted
product UI, an app screen, a push notification, a device frame all assert
that the thing exists and looks like that. A `Shows:` line may depict only
what `facts.md` establishes exists — a screenshot at a resolved path, a
screen described in the source. Scripting an app screen for a product that
ships as a web page is an invented product claim even when every word on it
is cited. The same rule reaches the hashtags and the alt text written at
Step 4: `#appdemo` or an alt text saying "download the app" asserts a
product form and an availability, and needs a `facts.md` line like any
sentence does.

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
cites a `facts.md` numbered item or is a visible `[CONFIRM: …]` · no cited
item is
itself marked `[CONFIRM: public?]` unless the user has resolved it · every
`Shows:` line depicts only what `facts.md` establishes exists · every
video-format text block has a `Place:` x/y range and it sits inside that
format's safe-zone bounds in [formats.md](formats.md) (carousel exempt) ·
hook written first · one CTA.
