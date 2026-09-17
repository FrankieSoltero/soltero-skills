# Step 3 — Compose

Composition mechanics are not this skill's job. Hand the plan to the
Hyperframes domain skills and let them own the HTML, the timing, and the
motion.

## Load the domain skills

`hyperframes-core` · `hyperframes-animation` · `hyperframes-creative` ·
`hyperframes-keyframes` · `hyperframes-cli`

Preflight already confirmed all five are installed. If one turns out to be
missing, stop and relay `npx hyperframes skills update` to the user as the
fix, exactly as at Step 0 — you never run the install yourself.

**Skip the `hyperframes` entry-point intent interview.** `plan.md` is the
brief — the subject, the beats, the on-screen copy, the duration and the
canvas are all decided and approved already. Running the interview restarts
the conversation and invites answers that contradict the plan.

## Build

Work in `<out>/composition/`. From the plan, give the domain skills:

- canvas and fps for the target format, from [formats.md](formats.md);
- the beat list with exact durations and on-screen text, verbatim from
  `plan.md` — including any `[CONFIRM: …]` brackets, which stay visible;
- brand colors, fonts and the **resolved** asset paths from `facts.md`;
- the safe-zone bounds for the format, as a layout constraint.

For `--format all`, build one composition per format from that format's
layout section — never one composition rescaled.

## Check — the gate

```bash
npx hyperframes check
```

Zero errors to proceed. Findings get fixed in the composition. Banned, in
this skill, always:

- `hyperframes check --no-contrast` — the contrast finding is the one that
  matters on a phone in daylight;
- `hyperframes cloud …`, `hyperframes lambda …` — rendering is local;
- `hyperframes publish` — this skill never publishes anything.

No second imaging or automation tool enters the pipeline. Playwright
screenshots, ImageMagick, an external editor — none of them were preflighted
and none of them produce the contract's files.

## Verify the safe zones yourself

`check` does not know about Instagram's chrome. Measure each text block on
its beat's **settled frame** — the first frame at least 0.5s after that
beat's last text-position keyframe — against the bounds in
[formats.md](formats.md). A block that clears the band only while it is
still animating in has not cleared it.

Looking at a snapshot is not measuring: it returns no numbers, so nothing is
actually checked. Read the boxes:

1. Serve `<out>/composition/` over a local static file server — a few lines
   of `node:http` is enough. **Install nothing.**
2. Open it in a browser at the format's exact canvas as the viewport
   (1080×1920 or 1080×1350), `devicePixelRatio` 1, scrolled to 0,0.
3. Seek the timeline to the settled frame:
   `window.__timelines['<timeline-id>'].time(<t>)`.
4. Read `getBoundingClientRect()` on each text block and compare its top,
   bottom and right against that format's bounds.

For step 1 to work the composition has to survive being opened outside the
Hyperframes runtime, which creates `window.__timelines` itself. Write the
guard line `window.__timelines = window.__timelines || {};` into the
composition: without it `index.html` throws on load and cannot be measured,
and with it `check`, `preview` and `render` behave exactly as before.

Optional cross-check: `npx hyperframes snapshot --at <t>` and compute the
ink bounding box of that PNG (a `node:zlib` decode does it with no
dependency). The ink box sits inside the CSS box — the two agree, they are
not the same number.

Do not reach for `npx hyperframes keyframes` (a static source parser — it
reports no boxes at all) or `hyperframes-animation`'s `animation-map.mjs`
(it bootstraps npm packages, which this skill never does).
