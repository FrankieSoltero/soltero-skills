<!-- markdownlint-disable MD013 -->

# instagram-studio — live render smoke (2026-09-17)

First end-to-end exercise of `skills/instagram-studio/` against the real
toolchain: Compose → `check` → Render → cover → bake-as-frame-0 →
`check-output.mjs`, run twice (`--format reel`, then `--format carousel`) by
following `skills/instagram-studio/SKILL.md` as an agent user would, including
its references, its gates and its handoffs to the five `hyperframes-*` domain
skills and to `skills/content-marketing/SKILL.md`.

**Project under test:** `tests/scenarios/instagram-studio/fixtures/web-app/`
(Streakly static landing page), copied to a scratch directory outside the repo.
No media, no composition and no rendered artifact is committed; this document is
the only file this task adds to the repo.

**Scratch root:**
`/private/tmp/claude-501/-Users-franciscosoltero-Desktop-Code-soltero-skills/693d0d86-478c-4c02-880b-59f4e2a51e86/scratchpad/live-render/web-app`
— abbreviated `<scratch>` below. Pasted command output is verbatim except that
this one absolute prefix is replaced by `<scratch>` (and `/Users/franciscosoltero`
by `/Users/…`) where it appeared; nothing else is edited, elided or reordered.

**Render approval.** `references/step-4-deliver.md` requires a preview URL and
the user's explicit approval before any render. The preview step was **run, not
skipped**: `npx hyperframes preview --background` was started for both
compositions and both URLs were verified to return HTTP 200 (evidence below).
The approval itself was **pre-granted by the task controller for this smoke
test** rather than obtained from an interactive user.

Both renders are **silent** — no `--sfx-dir` was passed, neither composition
contains an `<audio>` or `<video>` element, and `ffprobe` finds exactly one
stream (video) in `reel.mp4`.

None of the banned commands (`hyperframes check --no-contrast`,
`hyperframes cloud …`, `hyperframes lambda …`, `hyperframes publish`) was run.

## Result summary

| # | Required check | Result |
|---|---|---|
| 1 | `preflight.mjs` exits 0 | **PASS** — exit 0, 4/4 checks ok |
| 2 | `npx hyperframes check` → zero errors, reel | **PASS** — 0 errors; 2 rounds (round 1 already 0 errors + 5 warnings, round 2 0/0) |
| 3 | `npx hyperframes check` → zero errors, carousel | **PASS** — 0 errors, 0 warnings, 1 round |
| 4 | Reel renders with the real encoder | **PASS** — `render` exit 0, 480/480 frames, 16.0s |
| 5 | `reel.mp4` codec / pix_fmt / canvas / fps / duration | **PASS** — h264 · yuv420p · 1080×1920 · 30/1 · 16.000000s |
| 6 | `reel.mp4` is `+faststart` (`moov` before `mdat`) | **PASS** — box order `ftyp moov free mdat` |
| 7 | Cover picked at a settled frame per the skill's definition | **PASS** — hook settled frame t = 1.40s = frame 42 |
| 8 | Cover baked as frame 0, encoding contract preserved | **PASS** — PSNR frame-0 vs cover 18.03 dB → 37.03 dB; still h264/yuv420p/30/1080×1920/16.000000s/faststart |
| 9 | `check-output.mjs <reel-dir> --format all` exit 0 | **PASS** — `OK`, exit 0, 1 warning (quoted verbatim below) |
| 10 | `check-output.mjs <carousel-dir> --format all` exit 0 | **PASS** — `OK`, exit 0, 1 warning (quoted verbatim below) |
| 11 | Carousel slides exported and named `slide-01..05.png` | **PASS** — 5 slides, 1080×1350, contiguous |
| 12 | Safe zone: every reel text block top ≥ 250 · bottom ≤ 1500 · right ≤ 960 | **PASS** — 12/12 blocks, two independent measurements |
| 13 | Nothing binary or rendered committed to the repo | **PASS** — only this `.md` file is added |

**`check-output.mjs` exit code: 0 for both output directories.** Neither run
ever exited 1, so there was no fix loop against the validator, and the validator
itself was not touched.

## Tool versions

```text
$ npx --yes hyperframes --version
0.8.46

$ ffmpeg -version | head -2
ffmpeg version 9.0.1 Copyright (c) 2000-2026 the FFmpeg developers
built with Apple clang version 21.0.0 (clang-2100.1.1.101)

$ ffprobe -version | head -1
ffprobe version 9.0.1 Copyright (c) 2007-2026 the FFmpeg developers

$ node --version
v26.5.1
```

Platform: darwin 25.5.0 (Apple M5). Browser capture ran on hardware GPU
(`ANGLE (Apple, ANGLE Metal Renderer: Apple M5, Unspecified Version)`).

## Step 0 — Preflight

```text
$ node skills/instagram-studio/scripts/preflight.mjs
PREFLIGHT: ok
  ok    node               v26.5.1 (need v22 or newer)
  ok    ffmpeg             /opt/homebrew/bin/ffmpeg
  ok    ffprobe            /opt/homebrew/bin/ffprobe
  ok    hyperframes-skills all 5 skills installed
EXIT=0
```

**PASS.**

## Run 1 — `--format reel`, `--type launch`

Out-dir `<scratch>/instagram-output/`.

### Steps 1–2 (facts, plan)

`facts.md` holds 17 sourced lines plus an explicit "Assets" section. The fixture
contains **no** image, video, font or logo file — `grep -nE '<img|url\(|@font-face|src=' index.html styles.css`
returns no matches, and the only referenced path (`href="styles.css"`) resolves
— so there was no unresolved-asset stop at Step 1 and every beat is typographic.
`facts.md:17` (package version 0.3.0, `package.json` is `"private": true`) is
marked `[CONFIRM: public?]` and is never cited on screen or in the caption.

The project has **no URL, store link or domain anywhere** (`a.cta` at
`index.html:13` points at the in-page anchor `#get-started`). The `launch`
archetype's CTA is "where to get it", so per `references/step-2-plan.md` the CTA
destination ships as a **visible** `[CONFIRM: …]` bracket, on screen in the last
beat and as the last line of `caption.md`. That is what produces the validator
warning quoted below — it is the skill behaving correctly, not a defect.

Plan: 16.0s (inside 7–30s, inside the 12–20s target), five beats, every text
block carrying a `Place:` x/y range inside the reel bounds.

### Step 3 — `npx hyperframes check`

**Round 1 — 0 errors, 5 warnings** (`studio_missing_editable_id` on each of the
five `<section>` clips):

```text
Lint
  ⚠ studio_missing_editable_id: <section data-start="0"> has no id, so Studio cannot use a stable edit target for its timeline and canvas controls.
    …/composition/index.html [data-composition-id] t=0s
    Fix: Add a stable, human-readable id such as id="hero-title" or id="scene-1-card" to every timeline-visible element you want agents or Studio to edit.
  ⚠ studio_missing_editable_id: <section data-start="3.2"> …
  ⚠ studio_missing_editable_id: <section data-start="7"> …
  ⚠ studio_missing_editable_id: <section data-start="10.4"> …
  ⚠ studio_missing_editable_id: <section data-start="13.4"> …
  0 error(s), 5 warning(s), 0 info(s)

Runtime
  ◇ 0 errors, 0 warnings

Layout
  ◇ 0 issues across 9 sample(s)

Motion
  ◇ 0 errors, 0 warnings

Contrast
  ◇ 11/11 text checks pass WCAG AA

Snapshots
  ◇ disabled

◇  Check passed
```

The skill's gate (`SKILL.md:108`) is "zero **errors**", so round 1 already
cleared it. The five warnings were fixed anyway by giving each clip a stable id
(`beat-hook`, `beat-calendar`, `beat-reminders`, `beat-recap`, `beat-cta`).

**Round 2 — final, 0 errors and 0 warnings:**

```text
$ npx --yes hyperframes check
EXIT=0
◆  Checking composition
[INFO] [Compiler] Fetched 11 font face(s) for "Inter" from Google Fonts (cached to /Users/franciscosoltero/.cache/hyperframes/fonts/inter)
[INFO] [Compiler] Injected deterministic @font-face rules for 1 requested font families
[hyperframes] browserGpuMode probe → hardware (WebGL renderer vendor="Google Inc. (Apple)" renderer="ANGLE (Apple, ANGLE Metal Renderer: Apple M5, Unspecified Version)")

Lint
  ◇ 0 errors, 0 warnings

Runtime
  ◇ 0 errors, 0 warnings

Layout
  ◇ 0 issues across 9 sample(s)

Motion
  ◇ 0 errors, 0 warnings

Contrast
  ◇ 11/11 text checks pass WCAG AA

Snapshots
  ◇ disabled

◇  Check passed
```

**Rounds to a passing `check`: 2** (1 to zero errors, 2 to zero findings of any
kind). The only findings ever produced were the five `studio_missing_editable_id`
warnings above.

Before hand-authoring the motion, the catalog was searched as
`hyperframes-cli/SKILL.md` requires:
`npx hyperframes catalog --query "reveal a headline and a supporting line one beat at a time"`
→ `113 of 393 moves · local word match`. Nothing in the result set is a
pixel-positioned beat card at a fixed canvas with hard safe-zone bounds
(`line-by-line-slide`, `headline-slam`, `cta-lockup` all own their own layout),
so the beats were authored by hand — which that skill permits once nothing fits.

### Step 4 — preview

```text
$ npx --yes hyperframes preview --background
  Project   composition
  Studio    http://localhost:3002/#project/composition
  Server    http://localhost:3002
  Running in the background. Log: /Users/…/.local/state/hyperframes/previews/e38f74bf518a6dee.log

$ curl -s -o /dev/null -w "HTTP %{http_code}\n" "http://localhost:3002/#project/composition"
HTTP 200
```

Render proceeded on the controller's pre-approval (see "Render approval" above).

### Step 4 — render

```text
$ npx --yes hyperframes render --quality looks --output <scratch>/instagram-output/reel.mp4
EXIT=0
```

Output tail, verbatim:

```text
[INFO] [Render:trace] {"renderJobId":"a8252727-132a-44bd-889f-f373e744b48f","phase":"encode","status":"end","elapsedMs":10072,"durationMs":1812,"stagePhase":"capturing","hasAudio":false,"isPngSequence":false,"isGif":false,"chunkedEncode":false,"workerCount":4,"forceScreenshot":false,"totalFrames":480,"framesCompleted":480,"captureMode":"beginframe","captureOperation":"encode"}
[INFO] [Render:trace] {"renderJobId":"a8252727-132a-44bd-889f-f373e744b48f","phase":"assemble","status":"start","elapsedMs":10072,"stagePhase":"capturing","hasAudio":false,"workerCount":4,"forceScreenshot":false,"totalFrames":480,"framesCompleted":480,"captureMode":"beginframe","captureOperation":"encode"}
  ██████████████████████░░░  90%  Assembling final video
[INFO] [Render:trace] {"renderJobId":"a8252727-132a-44bd-889f-f373e744b48f","phase":"assemble","status":"end","elapsedMs":10097,"durationMs":25,"stagePhase":"capturing","hasAudio":false,"workerCount":4,"forceScreenshot":false,"totalFrames":480,"framesCompleted":480,"captureMode":"beginframe","captureOperation":"encode"}
[INFO] [Render:trace] {"renderJobId":"a8252727-132a-44bd-889f-f373e744b48f","phase":"pipeline","status":"checkpoint","elapsedMs":10117,"message":"artifact validated","totalElapsedMs":10116}
  █████████████████████████  100%  Render complete

◇  <scratch>/instagram-output/reel.mp4
   3.5 MB · 16.0s video · rendered in 10.1s
   screenshot capture · hardware gpu · compile 1.0s · extract 0.0s · audio 0.0s · probe 0.0s · setup 1.6s · capture 5.7s · encode 1.8s · assemble 0.0s
```

`hasAudio:false` on every trace line — the render is silent, as the skill
requires. **PASS.**

### `ffprobe` summary of `reel.mp4` (final, post-bake)

```text
$ ffprobe -v error -select_streams v:0 -show_entries stream=codec_name,pix_fmt,width,height,r_frame_rate,nb_frames -show_entries format=duration -of default=noprint_wrappers=1 reel.mp4
codec_name=h264
width=1080
height=1920
pix_fmt=yuv420p
r_frame_rate=30/1
nb_frames=480
duration=16.000000

$ ffprobe -v error -show_entries stream=index,codec_type,codec_name -of csv=p=0 reel.mp4
0,h264,video
```

One stream, video only. Canvas 1080×1920, fps exactly 30/1, duration 16.000000s
(inside 7–30), codec h264, pix_fmt yuv420p. **PASS.**

### Faststart — top-level MP4 box order

```text
$ node boxes.mjs reel.mp4
  offset=         0  size=        32  type=ftyp
  offset=        32  size=      6578  type=moov
  offset=      6610  size=         8  type=free
  offset=      6618  size=   2505684  type=mdat
box order: ftyp moov free mdat
FASTSTART: yes (moov at index 1, mdat at index 3)
```

`moov` precedes `mdat`. **PASS.** (`boxes.mjs` is a 30-line dependency-free
walker in the scratch dir; it uses the same UInt32BE-size + 4-byte-type parse as
`check-output.mjs`'s `isFaststart`, which also passes this file.)

### Cover frame choice and the bake-as-frame-0 step

`references/formats.md:58-66` defines the settled frame as *"the first frame at
least 0.5s after that beat's last text-position keyframe."*

In this composition every block enters at `beatStart + 0.15` / `+ 0.30` with a
0.6s `y`+`opacity` tween, so the hook's **last text-position keyframe is
0.30 + 0.60 = 0.90s**. The first frame at least 0.5s later is
`ceil(1.40 × 30) = 42`, i.e. **t = 1.40s exactly** (frame 42 at 30fps). The hook
is also the beat that reads on its own (`references/step-4-deliver.md:39-40`),
so it is the cover beat.

```text
$ ffmpeg -y -v error -i reel.mp4 -vf "select='eq(n\,42)'" -fps_mode passthrough -frames:v 1 -q:v 2 reel-cover.jpg
COVER EXIT=0
$ ffprobe -v error -select_streams v:0 -show_entries stream=codec_name,width,height -of default=noprint_wrappers=1 reel-cover.jpg
codec_name=mjpeg
width=1080
height=1920
```

Frame **index** 42 is selected, not a `-ss 1.4` seek, so the exported image is
the settled frame itself rather than the nearest keyframe.

Cover text placement against `references/formats.md:53-56` (key cover text must
sit inside the centered 1080×1080, i.e. y 420–1500 on a 1080×1920 cover): the
wordmark is y 560–644 and the tagline y 684–1004. Both inside. **PASS.**

**Bake as frame 0.** `references/step-4-deliver.md:41-43` requires the cover to
be baked as frame 0 of that video so the in-feed first frame and the uploaded
cover match. It matters here: at t = 0 every block is still at `opacity: 0`, so
the un-baked frame 0 is a blank paper frame. The skill names no command for
this, so it was done with the preflighted ffmpeg — a single-frame overlay gated
to `n == 0`, re-encoded with the contract's encoding flags:

```text
$ ffmpeg -y -v error -i reel.mp4 -i reel-cover.jpg \
    -filter_complex "[0:v][1:v]overlay=0:0:enable='eq(n\,0)':eof_action=repeat,format=yuv420p" \
    -c:v libx264 -preset medium -crf 18 -r 30 -an -movflags +faststart reel-baked.mp4
BAKE EXIT=0
```

Proof the bake landed, by PSNR of frame 0 against the cover:

```text
before bake:  [Parsed_psnr_0] PSNR r:17.704656 g:17.936456 b:18.472161 average:18.026001
after  bake:  [Parsed_psnr_0] PSNR r:35.979196 g:41.043884 b:35.797594 average:37.031875
```

18.03 dB (blank frame) → 37.03 dB (the cover, with one generation of
JPEG-then-h264 loss). The baked file is the `reel.mp4` probed above:
h264 · yuv420p · 1080×1920 · 30/1 · 16.000000s · 480 frames · `moov` before
`mdat`. **PASS** — the encoding contract survives the bake.

### Caption

Written under `skills/content-marketing/SKILL.md`'s claim-trace gate: `facts.md`
as the only given facts, audience/CTA from `plan.md`, platform Instagram, voice
taken from the project's own page copy. `caption.md` carries exactly the four
headings `check-output.mjs` requires, a claims table mapping every assertion to
a `facts.md` line, an explicit **cut** table (`"free forever"`, any user count
or rating, any comparison to other habit apps, any mobile app, and `facts.md:17`
because a `[CONFIRM: public?]` line is not a usable citation), and the delivery
contract's Claims/Checks/Open block. Caption body 634/2200 characters, 4
distinct hashtags.

### `check-output.mjs` — reel

```text
$ node skills/instagram-studio/scripts/check-output.mjs <scratch>/instagram-output --format all
OK: <scratch>/instagram-output [reel]
  warning  caption.placeholder  unresolved [CONFIRM: placeholder(s) — not post-ready until a human fills them in
EXIT=0
```

**Exit 0. PASS.** One warning, reproduced verbatim above and again verbatim in
`post-checklist.md` item 6. It is the deliberate, visible CTA placeholder: the
project contains no URL, so where to get Streakly is an open question the user
must answer before posting. It is not silently accepted on their behalf — it is
item 5 of the checklist, marked as blocking.

## Run 2 — `--format carousel`, `--type launch`

`instagram-output/` already existed, so per `SKILL.md:54-55` this run wrote to
`<scratch>/instagram-output-2026-09-17-142557/`.

Five slides (inside 3–10), same facts, same content type, hook on slide 1 and
the CTA on slide 5. Word counts 8 / 12 / 14 / 7 / 18 — all inside the ≤ ~25
budget in `references/formats.md:22-24`. Carousel is safe-zone exempt
(`references/step-2-plan.md:48-50`), so no `Place:` lines were written and no
bands were invented for it; the layout simply holds a 100px margin, comfortably
outside the "outer 5%" (54px / 67.5px) guidance.

### `npx hyperframes check` — carousel

Zero errors **and** zero warnings on the first round (the clip ids were written
in from the start, having learned that from run 1):

```text
$ npx --yes hyperframes check
EXIT=0
◆  Checking composition
[INFO] [Compiler] Fetched 11 font face(s) for "Inter" from Google Fonts (cached to /Users/franciscosoltero/.cache/hyperframes/fonts/inter)
[INFO] [Compiler] Injected deterministic @font-face rules for 1 requested font families
[hyperframes] browserGpuMode probe → hardware (WebGL renderer vendor="Google Inc. (Apple)" renderer="ANGLE (Apple, ANGLE Metal Renderer: Apple M5, Unspecified Version)")

Lint
  ◇ 0 errors, 0 warnings

Runtime
  ◇ 0 errors, 0 warnings

Layout
  ◇ 0 issues across 9 sample(s)

Motion
  ◇ 0 errors, 0 warnings

Contrast
  ◇ 16/16 text checks pass WCAG AA

Snapshots
  ◇ disabled

◇  Check passed
```

**Rounds to a passing `check`: 1. No errors of any kind were ever produced.**

### Preview and slide export

```text
$ npx --yes hyperframes preview --background
  Studio    http://localhost:3003/#project/composition
  Server    http://localhost:3003
$ curl -s -o /dev/null -w "HTTP %{http_code}\n" "http://localhost:3003/#project/composition"
HTTP 200
```

Each slide is captured at its beat's settled frame (`beatStart + 1.40`, by the
same arithmetic as the reel):

```text
$ npx --yes hyperframes snapshot --at 1.40,3.40,5.40,7.40,9.40 --no-end -o slides
EXIT=0
◆  Capturing 5 frames at [1.4s, 3.4s, 5.4s, 7.4s, 9.4s] from composition
   Fonts: 2 loaded, 3 unused
◇  5 snapshots saved to …/composition/slides
   slides/frame-00-at-1.4s.png
   slides/frame-01-at-3.4s.png
   slides/frame-02-at-5.4s.png
   slides/frame-03-at-7.4s.png
   slides/frame-04-at-9.4s.png
   contact-sheet.jpg (grid view for AI review)
   --describe: GEMINI_API_KEY not set, skipping
```

Renamed contiguously from 1 into the out-dir as `slide-01.png` … `slide-05.png`
(see finding 3 for why `--no-end` is load-bearing here).

### `check-output.mjs` — carousel

```text
$ node skills/instagram-studio/scripts/check-output.mjs <scratch>/instagram-output-2026-09-17-142557 --format all
OK: <scratch>/instagram-output-2026-09-17-142557 [carousel]
  warning  caption.placeholder  unresolved [CONFIRM: placeholder(s) — not post-ready until a human fills them in
EXIT=0
```

**Exit 0. PASS.** Same warning, same cause, same verbatim reproduction in that
run's `post-checklist.md`.

## Safe-zone measurement (reel)

Bounds from `references/formats.md:39`: **top ≥ 250 · bottom ≤ 1500 ·
right ≤ 960**. Settled frame per `references/formats.md:58-66`: the first frame
at least 0.5s after that beat's last text-position keyframe.

### Measurement A — `getBoundingClientRect()` on the composition DOM

The composition was served from the scratch dir over a dependency-free
`node:http` static server and driven in a browser at a 1080×1920 viewport
(`devicePixelRatio 1`, `scrollX = scrollY = 0`), seeking the registered timeline
with `window.__timelines['reel'].time(t)` and reading each text block's
`getBoundingClientRect()` at that timestamp.

| Beat | Settled frame | Block | top | bottom | left | right | Verdict |
|---|---|---|---|---|---|---|---|
| Hook | **1.40s** | `#h-mark` (wordmark) | 560 | 644 | 110 | 950 | PASS |
| Hook | 1.40s | `#h-rule` (flame accent, not text) | 656 | 666 | 110 | 278 | PASS |
| Hook | 1.40s | `#h-tag` (tagline) | 684 | 1004 | 110 | 950 | PASS |
| Beat 2 — Streak calendar | 4.60s | `#b2-label` | 640 | 712 | 110 | 950 | PASS |
| Beat 2 | 4.60s | `#b2-body` | 752 | 1064 | 110 | 950 | PASS |
| Beat 3 — Smart reminders | 8.40s | `#b3-label` | 640 | 712 | 110 | 950 | PASS |
| Beat 3 | 8.40s | `#b3-body` | 752 | 1064 | 110 | 950 | PASS |
| Beat 4 — Weekly recap | 11.80s | `#b4-label` | 640 | 712 | 110 | 950 | PASS |
| Beat 4 | 11.80s | `#b4-body` | 752 | 1064 | 110 | 950 | PASS |
| CTA | 14.95s | `#c-chip` ("Free during beta.") | 600 | 684 | 110 | 950 | PASS |
| CTA | 14.95s | `#c-confirm` (`[CONFIRM: …]`) | 724 | 1036 | 110 | 950 | PASS |
| CTA | 14.95s | `#c-mark` (wordmark) | 1096 | 1168 | 110 | 950 | PASS |

Worst case on each bound across all 12 blocks: **min top 560** (limit ≥ 250,
margin 310px) · **max bottom 1168** (limit ≤ 1500, margin 332px) · **max right
950** (limit ≤ 960, margin 10px).

The evaluator returned `"allPass": true, "failures": []`.

**SAFE-ZONE: PASS.**

### Measurement B — ink bounds on the rendered settled-frame PNG

Independent corroboration on the actual rendered pixels of the hook's settled
frame (`snapshot --at 1.40`, the same frame the cover comes from), so it uses
the real injected Inter webfont rather than the DOM box. The PNG was decoded
with a pure-`node:zlib` decoder (no image library was installed), ink pixels
taken as luma < 150, rows grouped into blocks across gaps ≥ 24px:

```text
$ node measure-png.mjs …/snapshots/frame-00-at-1.4s.png
file: …/snapshots/frame-00-at-1.4s.png  canvas: 1080x1920  luma<150  rowGap>=24
bounds: top >= 250 · bottom <= 1500 · right <= 960
  block  top= 580  bottom= 625  left= 112  right= 486  PASS
  block  top= 656  bottom= 666  left= 110  right= 278  PASS
  block  top= 762  bottom= 922  left= 111  right= 924  PASS
SAFE-ZONE: PASS
EXIT=0
```

The three ink boxes sit inside their three DOM boxes, as they must — the CSS box
includes leading, the ink box does not. Both methods agree: **PASS**.

## Scratch output files (paths only — media stays in scratch)

All under `<scratch>` =
`/private/tmp/claude-501/-Users-franciscosoltero-Desktop-Code-soltero-skills/693d0d86-478c-4c02-880b-59f4e2a51e86/scratchpad/live-render/web-app`.

### Run 1 — `<scratch>/instagram-output/`

| File | Bytes |
|---|---|
| `reel.mp4` | 2,512,302 |
| `reel-cover.jpg` | 57,231 |
| `caption.md` | 3,597 |
| `facts.md` | 2,718 |
| `plan.md` | 3,853 |
| `post-checklist.md` | 2,012 |
| `composition/index.html` | 7,856 |
| `composition/hyperframes.json` | 318 |
| `composition/package.json` | 296 |
| `composition/meta.json` | 93 |
| `composition/AGENTS.md` | 8,002 |
| `composition/CLAUDE.md` | 8,002 |
| `composition/snapshots/frame-00-at-1.4s.png` | 341,589 |
| `composition/snapshots/frame-01-at-4.6s.png` | 360,618 |
| `composition/snapshots/frame-02-at-8.4s.png` | 372,486 |
| `composition/snapshots/frame-03-at-11.8s.png` | 355,059 |
| `composition/snapshots/frame-04-at-14.95s.png` | 366,861 |
| `composition/snapshots/contact-sheet.jpg` | 173,353 |
| `composition/.thumbnails/` (6 files, preview cache) | 10,402 total |

### Run 2 — `<scratch>/instagram-output-2026-09-17-142557/`

| File | Bytes |
|---|---|
| `slide-01.png` | 233,879 |
| `slide-02.png` | 249,299 |
| `slide-03.png` | 263,769 |
| `slide-04.png` | 242,205 |
| `slide-05.png` | 256,978 |
| `caption.md` | 3,406 |
| `facts.md` | 2,718 |
| `plan.md` | 2,938 |
| `post-checklist.md` | 1,861 |
| `composition/index.html` | 7,868 |
| `composition/hyperframes.json` | 318 |
| `composition/package.json` | 296 |
| `composition/meta.json` | 93 |
| `composition/AGENTS.md` | 8,002 |
| `composition/CLAUDE.md` | 8,002 |
| `composition/slides/frame-0{0..4}-at-{1.4,3.4,5.4,7.4,9.4}s.png` | 1,246,130 total |
| `composition/slides/contact-sheet.jpg` | 164,861 |
| `composition/.thumbnails/` (10 files, preview cache) | 25,690 total |

### Measurement helpers (scratch, not part of any deliverable)

| File | Purpose |
|---|---|
| `<scratch>/../serve.mjs` | dependency-free `node:http` static server for the DOM measurement |
| `<scratch>/../measure-png.mjs` | `node:zlib` PNG decoder + ink-bbox segmenter (measurement B) |
| `<scratch>/../boxes.mjs` | top-level MP4 box walker (faststart evidence) |
| `<scratch>/../evidence/reel/{frame0,cover-ref,prebake-frame0}.png` | PSNR inputs for the bake proof |

## Findings against the skill

Ordered roughly by how much they cost a first-time agent user. None of these
were fixed in `skills/` or `tests/` — every one was worked around in the scratch
project and is recorded here for the owner.

### 1. `SKILL.md:140-142` — "the only network call is `npx` resolving the `hyperframes` package" is not true of the real toolchain

**What happened.** Hard rule 4 states: *"Rendering is local. The only network
call is `npx` resolving the `hyperframes` package."* The real toolchain makes at
least four other kinds of network call, unavoidably:

- `hyperframes check` / `snapshot` / `render` each print
  `[INFO] [Compiler] Fetched 11 font face(s) for "Inter" from Google Fonts` —
  a live fetch from `fonts.googleapis.com`, cached under
  `~/.cache/hyperframes/fonts/`. It fires for any named `font-family`, and
  `facts.md` naming the project's typeface (Inter) is the normal case.
- `hyperframes init`'s scaffold writes
  `<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js">`
  into `index.html`, so the composition itself loads GSAP from a CDN at check,
  snapshot, preview and render time. (Also: no `integrity` attribute — a
  supply-chain exposure the skill inherits from the scaffold and never mentions.)
- `hyperframes init` prints `Checking AI coding skills against GitHub…`.
- `hyperframes catalog` reads a remote registry manifest (it printed six
  `hyperframes:registry skipped item … Invalid registry manifest` lines).

**Workaround.** Proceeded — there is no way to run the skill without these. The
rule needs rewording to what it actually means (no *upload*, no cloud render, no
posting, no API call that sends the user's content anywhere), because as written
a careful agent reading rule 4 literally must stop at Step 3.

### 2. `references/step-4-deliver.md:39-43` — the cover export and the frame-0 bake have no command, and the bake is not trivial

**What happened.** The skill says *"Export it at that format's full canvas, and
bake that same image as frame 0 of **that** video"* and names no command for
either half. `hyperframes snapshot` writes PNG only (no JPEG option), so it
cannot produce `reel-cover.jpg` directly; and nothing in the Hyperframes CLI
bakes a still into an existing MP4. Meanwhile `check-output.mjs` probes the
cover's canvas, so the file has to be a real 1080×1920 image, and the video has
to stay h264 / yuv420p / `+faststart` after whatever the bake does to it.

The bake is load-bearing, not cosmetic: with a normal entrance animation, frame
0 is the *pre-entrance* state. Here every block is at `opacity: 0` at t = 0, so
the un-baked first frame is blank — PSNR of un-baked frame 0 against the cover
was 18.03 dB.

**Workaround.** Used the preflighted ffmpeg (nothing new installed, nothing
un-preflighted): `-vf "select='eq(n\,42)'" -frames:v 1 -q:v 2` for the cover
(frame **index**, so it is exactly the settled frame), then
`-filter_complex "[0:v][1:v]overlay=0:0:enable='eq(n\,0)':eof_action=repeat,format=yuv420p" -c:v libx264 -crf 18 -r 30 -an -movflags +faststart`
for the bake. Re-verified codec/pix_fmt/fps/duration/box-order afterwards, and
PSNR rose to 37.03 dB. The skill should ship these two commands verbatim, and
should say out loud that the bake costs a second lossy generation and therefore
belongs *after* the render, once, not on every iteration.

### 3. `references/step-4-deliver.md:21` — `snapshot --at t1,t2,t3` writes N+1 PNGs, which silently corrupts the slide numbering

**What happened.** `--end` defaults to **true**, so
`npx hyperframes snapshot --at <t1>,<t2>,<t3>` captures the three requested
times *plus* an extra end-of-timeline frame, and also writes `contact-sheet.jpg`
beside them. An agent that follows line 21 literally and then follows line 22
("Rename snapshot output to `slide-01.png` … contiguously from 1") produces one
extra slide that was never in the plan — and would fail its own plan's slide
count, or worse, pass `check-output.mjs` with a stray end frame as the last
slide.

**Workaround.** `npx hyperframes snapshot --at 1.40,3.40,5.40,7.40,9.40 --no-end -o slides`
and then an explicit per-file copy to `slide-01.png` … `slide-05.png`, never a
glob. The skill's command should carry `--no-end`.

### 4. `references/step-4-deliver.md:21-23` — where snapshot output lands, and what it is called, is not stated

**What happened.** `snapshot` defaults its output to `<project>/snapshots`, i.e.
*inside* `<out>/composition/`, not the out-dir, and names files
`frame-00-at-1.4s.png` — not anything resembling `slide-01.png`. The skill says
"rename" without saying from where or from what, and `-o/--output` (a directory)
is never mentioned.

**Workaround.** `-o slides` to keep the raw captures out of the default
`snapshots/` path, then copied each one up to the out-dir under its slide name.
Note the raw PNGs remain in `composition/slides/` — ~1.2 MB of duplicated
pixels per run that the skill's file list does not account for (see finding 9).

### 5. `references/step-3-compose.md:52-58` — the skill demands a safe-zone measurement but supplies no way to measure

**What happened.** Step 3 ends with *"Measure each text block on its beat's
settled frame … against the bounds in formats.md"*, and the Step-2 gate makes
every text block carry an x/y `Place:` range. The only tool offered is
`npx hyperframes snapshot --at <t>`, which "gives you the frame to look at" —
i.e. eyeballing a PNG. That is exactly the failure mode the skill's own
rationalization table mocks ("Keep all text inside a safe zone of x:40–1040,
y:250–1600" — *"Invented per run, wrong per run"*): an eyeballed frame gives no
numbers, so nothing is actually checked.

The two in-toolchain candidates both fail:

- `npx hyperframes keyframes . --json` is a **static source parser**, not a
  runtime sampler. It reports no bounding boxes at all, and it could not even
  resolve tweens created through a helper function — every one came back as
  `{"id":"__unresolved__-fromTo-__raw:at","target":"__unresolved__"}`.
- `hyperframes-animation/scripts/animation-map.mjs` *does* sample bboxes, but
  refuses to run: `Error: Required helper package(s) are missing. … The
  bootstrap command will be: npm install --ignore-scripts --no-save
  @hyperframes/producer@latest @hyperframes/core@latest`. Running it would
  violate instagram-studio's own "never installs anything" (`SKILL.md:3`).

**Workaround.** Two independent measurements, both with zero new dependencies:
(A) served the composition over a `node:http` static server and read
`getBoundingClientRect()` in a browser at the settled timestamp after seeking
`window.__timelines['reel'].time(t)`; (B) decoded the settled-frame PNG with
`node:zlib` and computed ink bounding boxes directly. The skill should specify
one of these (A is the one the brief names) as a concrete procedure, or ship it
as a third bundled script — otherwise the safe-zone gate is unenforceable and
will be satisfied by assertion.

### 6. `references/step-3-compose.md` / `references/step-4-deliver.md` — the composition cannot be opened outside the HyperFrames runtime, which is what a DOM measurement needs

**What happened.** `hyperframes-core` states the runtime creates
`window.__timelines` before inline scripts run and that the
`window.__timelines = window.__timelines || {}` guard is no longer needed. True
under the runtime — but it means the composition `index.html` throws on load
when opened any other way, so the DOM measurement in finding 5 is impossible
against the file the skill tells you to write.

**Workaround.** Added one line to both compositions:
`window.__timelines = window.__timelines || {};`. It is a no-op under `check`,
`preview` and `render` (both compositions pass `check` with 0/0 with it in
place), and it makes the file measurable. If the skill keeps the safe-zone gate,
it should ask for this line.

### 7. `references/step-4-deliver.md:5-7` — `preview --background` rewrites the composition source in place

**What happened.** The skill presents preview as a read-only review surface.
Running `npx hyperframes preview --background` **modified
`composition/index.html` on disk**: it stamped `data-hf-id="hf-…"` onto every
element, rewrote `<!doctype html>` to `<!DOCTYPE html>`, and expanded
self-closing `<meta … />` tags. This happened for both compositions.

**Workaround.** None needed for correctness — `check` still passes and the
render is unaffected — but it is a surprise worth one line in step-4, because
anything that hashes, diffs or version-controls `composition/` after the preview
step sees a changed file it did not write.

### 8. `SKILL.md:54-56` + `references/formats.md:74-75` — running the skill twice produces two unrelated out-dirs, and the skill never says what that means

**What happened.** "Everything is written to `instagram-output/`. If that
directory already exists, use `instagram-output-YYYY-MM-DD-HHmmss/`." Running
`--format reel` then `--format carousel` therefore yields two directories, each
with its own `facts.md`, `caption.md`, `plan.md`, `post-checklist.md` and
`composition/`. Consequences the skill does not address:

- `check-output.mjs … --format all` can only ever see one format per directory,
  so "all" never means all of the user's deliverables — it means "every format
  present in *this* directory". Both runs here printed `[reel]` and `[carousel]`
  respectively, never both.
- The second run has to decide whether to re-derive `facts.md` from the project
  or reuse the first run's. Nothing says which. (I copied it, so the two runs'
  claims are provably identical — but an agent that re-derives could produce two
  different `facts.md` line numberings and two caption claims tables that cite
  incompatible line numbers.)

**Workaround.** Copied `facts.md` verbatim into the second out-dir and ran the
validator once per directory. The skill should either say "a second invocation
against the same project reuses the existing `facts.md`" or make `--format all`
the supported way to get more than one format.

### 9. `references/formats.md:68-75` — the "fixed filenames" list does not describe what is actually in the out-dir

**What happened.** The list is presented as exhaustive ("Output filenames —
fixed … All of it in `instagram-output/`"). A real run also leaves, inside
`composition/`: `AGENTS.md` and `CLAUDE.md` (8 KB each, written by
`hyperframes init`), `hyperframes.json`, `meta.json`, `package.json`, a
`.thumbnails/` preview cache, and — for the carousel — a full duplicate copy of
every exported slide plus a `contact-sheet.jpg`. `du -sk composition` reports 1,996 KB for the reel run and
1,468 KB for the carousel run — 1.4–2.0 MB per run of files a user handed this
directory has no way to interpret from the reference.

**Workaround.** Left them in place (deleting them would break re-rendering) and
documented the directory contents in each run's `post-checklist.md`. The
reference should say the list covers the *deliverables* and that `composition/`
additionally holds the toolchain's own working files.

### 10. `hyperframes-cli/SKILL.md:83` vs `instagram-studio/SKILL.md:140-142` — the catalog-miss feedback convention is banned by this skill, and neither says so

**What happened.** `hyperframes-cli` treats
`npx hyperframes feedback --search-miss …` as an obligation after a catalog
search that returns nothing usable, and `catalog --query` prints the pre-filled
command. That command posts to a public channel. instagram-studio's hard rule 4
bans every network call except npx resolution, and `hyperframes-cli` also asks
for a post-render `feedback --rating` report.

**Workaround.** Did not send either. The skill should state explicitly that the
Hyperframes telemetry/feedback commands are out of scope for this skill, the
same way it lists the four banned commands — otherwise an agent that has just
been told to "let the domain skills own it" will dutifully report a search miss
and leak the run.

### 11. `references/step-4-deliver.md` — ffmpeg 9 removed `-vsync`, and the skill leaves cover export to unaided recall

**What happened.** Because the skill supplies no cover command (finding 2), the
agent writes one from memory. The idiomatic single-frame extraction most models
have memorized uses `-vsync 0`, which this machine's ffmpeg rejects outright:

```text
Unrecognized option 'vsync'.
Error splitting the argument list: Option not found
```

`preflight.mjs` only checks that `ffmpeg`/`ffprobe` exist on PATH — it never
records or gates on a version — so this surfaces at Step 4, after the render.

**Workaround.** `-fps_mode passthrough`, the ffmpeg-5+ spelling. If finding 2 is
addressed by shipping the commands, this goes away; if not, step-4 should name
`-fps_mode` explicitly.

### 12. `skills/instagram-studio/scripts/preflight.mjs` — preflight never proves the Hyperframes CLI itself runs

**What happened.** Preflight checks four things: node major version, `ffmpeg` on
PATH, `ffprobe` on PATH, and the five `hyperframes-*` skill directories under
`~/.claude/skills/`. It never runs `npx hyperframes --version`, never checks
that the render browser can launch, and never records the CLI version. So a
machine with all five *skills* installed but a broken npm cache, no network for
the first `npx` resolve, or an unusable Chromium passes preflight and fails at
Step 3 — after `facts.md` and `plan.md` have been written, which is exactly the
"route around a broken toolchain" cost the skill exists to prevent.

**Workaround.** None needed here (everything resolved), but `npx hyperframes --version`
was run manually first and its output is recorded in "Tool versions" above.
Adding it as a fifth preflight check, with `npx hyperframes skills update` or
`npx hyperframes doctor` as the fix string, would close the gap and would also
put the CLI version into every run's evidence.

## Things the skill got right

Worth recording alongside the findings, since this run was the first real test:

- The `facts.md` → `plan.md` → composition chain held end to end. Every on-screen
  line and every caption line traces to a `facts.md` line number, and the one
  claim with no source (where to get the product) survived as a **visible**
  `[CONFIRM: …]` through the plan, the render, the slides and the caption,
  exactly as `references/step-2-plan.md` requires — and the validator flagged it.
- `facts.md:17` (`[CONFIRM: public?]`, package version from a `"private": true`
  `package.json`) was correctly unusable as a citation and appears nowhere on
  screen.
- The fixed filenames and the per-format cover amendment work: `check-output.mjs`
  accepted `reel-cover.jpg` and `slide-01..05.png` without complaint and gave a
  clean exit-0 both times.
- Looking the numbers up rather than recalling them produced a video that is
  exactly 1080×1920 / 30fps / 16.0s / h264 / yuv420p / faststart on the first
  render, with no encoding fix loop at all.
- The safe-zone bounds are achievable with real copy at real sizes: the tightest
  margin across 12 measured blocks was 10px on the right bound, and that was a
  deliberate layout choice, not a near-miss.
