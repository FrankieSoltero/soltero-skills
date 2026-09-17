# Step 4 — Render, caption, deliver

## Preview before render

```bash
npx hyperframes preview --background
```

Hand the user the URL and ask whether to revise or render. **Render only on
their approval** — a passing `check` is not approval.

`preview` is **not read-only**: `--background` rewrites the composition
source in place. It stamps `data-hf-id="hf-…"` onto every element, rewrites
`<!doctype html>` to `<!DOCTYPE html>`, and expands self-closing
`<meta … />` tags. Expect that diff under `composition/` after this step;
`check` and the render are unaffected, and it is not yours to revert.

## Render

Video formats render to the fixed filenames in [formats.md](formats.md);
carousel slides are exported as stills:

```bash
npx hyperframes render --output <out-dir>/reel.mp4
npx hyperframes render --output <out-dir>/feed.mp4
npx hyperframes render --output <out-dir>/story-1.mp4   # …-2, …-3
npx hyperframes snapshot --at <t1>,<t2>,<t3> --no-end -o slides
```

One render per format, each from that format's own composition.

`--no-end` is load-bearing on the snapshot line: `--end` defaults on, so
`--at t1,t2,t3` captures the three requested times **plus** an
end-of-timeline frame — N+1 PNGs, and a stray last slide the plan never had.
It also writes a `contact-sheet.jpg` beside them either way.

The captures land in `<project>/slides` (with no `-o`, in
`<project>/snapshots`), named `frame-00-at-1.4s.png` — nothing resembling a
slide name, and inside `composition/`, not the out-dir. So:

1. count the PNGs — the number of captured frames must equal the planned
   slide count before you rename anything;
2. copy each one explicitly into the out-dir under its slide name —
   `slides/frame-00-at-1.4s.png` → `<out-dir>/slide-01.png`, and so on,
   contiguously from 1. One file at a time, never a glob.

**If the render fails, surface the Hyperframes CLI output verbatim** and
stop. Diagnose and re-render, or hand the error back. There is no fallback
renderer, no alternative encoder, and no manual assembly path.

## Covers — one per video format

`reel.mp4` gets `reel-cover.jpg` (1080×1920); `feed.mp4` gets
`feed-cover.jpg` (1080×1350). There is no single shared cover file. Under
`--format all` you produce both, each from **its own** composition — a reel
cover rescaled to 4:5 is a crop, and the validator measures the canvas.

For each one, pick the frame from a **settled frame** — the first frame at
least 0.5s after that beat's last text-position keyframe — of a beat that
reads on its own, usually the hook's resolved state. Export it at that
format's full canvas, and bake that same image as frame 0 of **that**
video, so the in-feed first frame and the uploaded cover match. Key cover
text sits inside the centered 1080×1080 crop.

`snapshot` writes PNG only and nothing in the Hyperframes CLI bakes a still
into an MP4, so both halves are ffmpeg — the one preflight already checked,
with nothing new installed. Select by frame **index**, not `-ss <seconds>`,
so you get the settled frame itself and not the nearest keyframe. The index
is `ceil(t * 30)`, not `round`: the settled frame is the **first** frame at
least 0.5s after the keyframe, so rounding down would pick a frame that is
still animating:

```bash
# cover — frame index = ceil(t * 30) at 30fps; 42 is t = 1.40s
ffmpeg -y -v error -i <out-dir>/reel.mp4 \
  -vf "select='eq(n\,42)'" -fps_mode passthrough -frames:v 1 -q:v 2 \
  <out-dir>/reel-cover.jpg
```

ffmpeg 9 removed `-vsync`; `-fps_mode` is the spelling that works. An ffmpeg
that rejects `-fps_mode` is older than 5 and wants `-vsync 0` instead — read
the version, do not guess which spelling this machine takes. Then bake
the same image over frame 0 only, re-encoding with the contract's flags —
h264, yuv420p, 30fps, `+faststart`, no audio:

```bash
ffmpeg -y -v error -i <out-dir>/reel.mp4 -i <out-dir>/reel-cover.jpg \
  -filter_complex \
  "[0:v][1:v]overlay=0:0:enable='eq(n\,0)':eof_action=repeat,format=yuv420p" \
  -c:v libx264 -preset medium -crf 18 -r 30 -an -movflags +faststart \
  <out-dir>/reel-baked.mp4
mv <out-dir>/reel-baked.mp4 <out-dir>/reel.mp4
```

Swap `reel` for `feed` for the 4:5 video. The bake is not cosmetic: with a
normal entrance animation frame 0 is the pre-entrance state, which is often
blank. It also costs a second lossy generation, so do it **once, after the
render** — not on every iteration — and re-run `check-output.mjs` after it,
since the baked file is the one being shipped.

## Audio

Render **silent** by default. `--sfx-dir <path>` mixes in the user's own
files and nothing else; `--no-sfx` is the explicit default. Never bundle,
propose, or go looking for a music track — the checklist tells the user to
add audio from Instagram's own library at upload time, which is also the
only place the licensing works.

## Caption — hand off, do not freelance

Invoke `soltero-skills:content-marketing` to write the caption, hashtags and
alt text. It owns the claim-trace gate and the claims-table delivery
contract; this skill's job is to hand it the right inputs and to place its
output.

Give it: `facts.md` as the given facts (the only ones), the audience and the
ONE CTA from `plan.md`, platform Instagram, and the voice source. Its
claims table becomes the `## Claims` section. 3–5 specific hashtags — no
mega-tags, and no network lookup.

Write the result to `caption.md` with exactly these four headings, which
`check-output.mjs` requires:

```markdown
## Caption

## Hashtags

## Alt text

## Claims
```

Any `[CONFIRM: …]` / `[NEED: …]` placeholder stays visible in the file. The
validator warns about it, and that warning is the user's decision to make.

**Last check before `caption.md` is done.** Walk the claims table. For every
row that is unresolved — `[CONFIRM: …]`, `[NEED: …]`, no source — read the
caption body, the hashtags and the alt text and confirm two things: the
bracketed placeholder is there, and the claim sentence is **not**. A flagged
row licenses the placeholder, never the sentence; the placeholder goes
exactly where the sentence would have gone. `check-output.mjs` cannot make
this distinction — its `caption.placeholder` warning fires on any
`[CONFIRM:` anywhere in the file, so it reads identically whether you kept
the claim out of the body or printed it there.

## Validate

```bash
node "${CLAUDE_SKILL_DIR}/scripts/check-output.mjs" <out-dir> --format <fmt>
```

- Exit 0 → done. Any warnings go to the user **verbatim**, with what they
  mean for posting.
- Exit 1 → fix what the named error codes point at and re-run. Not a
  judgment call, not something to explain around.
- Exit 2 → a usage problem, a missing out-dir, or ffprobe absent. Fix the
  invocation, or you are back at Step 0.

## `post-checklist.md`

The handover. It says, for this run:

1. what to upload, in order, and which file is which;
2. add audio in the Instagram composer (the render is silent);
3. upload that format's cover — `reel-cover.jpg` for the reel,
   `feed-cover.jpg` for the feed post;
4. paste `## Caption` and `## Hashtags`; paste `## Alt text` into
   Instagram's alt-text field;
5. every `[CONFIRM: …]` still open — these block posting;
6. anything the validator warned about.

## Never claim it is posted

The deliverable is a directory of files and this checklist. Say what was
produced and where; say the user posts it. Do not say scheduled, live,
published, or "ready and posted" — and never report a render you did not
watch succeed.
