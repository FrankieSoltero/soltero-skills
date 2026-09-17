# Formats — the exact values

Look these up. Do not recall them, do not derive them, do not let a request
for a different canvas or slide count override them. `check-output.mjs`
enforces the machine-checkable ones; the safe zones and the word budget are
guidance for you, so they are the ones you have to hold yourself.

## Canvas, duration, output

<!-- markdownlint-disable MD013 -->
| Format | Canvas | Duration | Output |
|---|---|---|---|
| `reel` | 1080×1920, 30fps | 7–30s (target 12–20s) | `reel.mp4` + `reel-cover.jpg` |
| `story` | 1080×1920, 30fps | ≤15s per file, 1–3 files | `story-1.mp4` … `story-3.mp4` |
| `feed` | 1080×1350, 30fps | 7–30s | `feed.mp4` + `feed-cover.jpg` |
| `carousel` | 1080×1350 PNG | 3–10 slides | `slide-01.png` … `slide-10.png` |
<!-- markdownlint-enable MD013 -->

- 7–30s is the hard range for `reel` and `feed`; **12–20s is the default
  target** — plan into it unless the user gave `--duration`.
- `feed` is a re-layout of the reel at 4:5, never a crop of it.
- Carousel: slide 1 is the hook, the last slide is the CTA, and every slide
  holds **≤ ~25 words**. That budget is guidance, not machine-checked, which
  is exactly why a 55–65 word slide survives without it.

## Video encoding

Codec `h264` · pix_fmt `yuv420p` · `+faststart` (the `moov` box must come
before `mdat`) · audio, when present, `aac`.

## Safe zones

Instagram's own chrome covers the edges of the canvas. Keep **key text and
any logo** inside these bounds; background motion may run full-bleed.

<!-- markdownlint-disable MD013 -->
| Format | Clear bands | Text-block bounds on the canvas |
|---|---|---|
| `reel` | top 250px · bottom 420px · right 120px | top ≥ 250 · bottom ≤ 1500 · right ≤ 960 |
| `story` | top 250px · bottom 340px | top ≥ 250 · bottom ≤ 1580 |
| `feed` | no platform chrome over the frame | keep text off the outer 5% |
| `carousel` | no platform chrome over the frame | keep text off the outer 5% |
<!-- markdownlint-enable MD013 -->

Story also needs room left for stickers and the link — do not fill the
bottom band with copy and plan to "move the sticker".

**Covers are per format.** `reel-cover.jpg` is 1080×1920 and
`feed-cover.jpg` is 1080×1350 — each a full-canvas frame of its own video.
There is no single shared cover file: one image cannot be both canvases,
and under
`--format all` both covers exist side by side.

The profile grid crops a cover to 1:1, so **key cover text must sit inside
the centered 1080×1080 region** — y 420–1500 on `reel-cover.jpg`, y 135–1215
on `feed-cover.jpg`.

## Settled frame

Used for each format's cover pick and for any safe-zone measurement:

> The **settled frame** of a beat is the first frame at least 0.5s after
> that beat's last text-position keyframe.

Measure a text block's bounds on the settled frame, not mid-animation — a
line that is still flying in clears every band and tells you nothing.

## Output filenames — fixed

`reel.mp4` · `feed.mp4` · `story-1.mp4` … `story-3.mp4` · `reel-cover.jpg` ·
`feed-cover.jpg` · `slide-01.png` … `slide-10.png` · `caption.md` ·
`facts.md` · `plan.md` · `post-checklist.md` · `composition/`

All of it in `instagram-output/`, or `instagram-output-YYYY-MM-DD-HHmmss/`
when that directory already exists. Slides and story files are numbered
contiguously from 1.
