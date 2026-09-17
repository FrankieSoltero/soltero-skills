# Step 4 — Render, caption, deliver

## Preview before render

```bash
npx hyperframes preview --background
```

Hand the user the URL and ask whether to revise or render. **Render only on
their approval** — a passing `check` is not approval.

## Render

Video formats render to the fixed filenames in [formats.md](formats.md);
carousel slides are exported as stills:

```bash
npx hyperframes render --output <out-dir>/reel.mp4
npx hyperframes render --output <out-dir>/feed.mp4
npx hyperframes render --output <out-dir>/story-1.mp4   # …-2, …-3
npx hyperframes snapshot --at <t1>,<t2>,<t3>   # one per carousel slide
```

One render per format, each from that format's own composition. Rename
snapshot output to `slide-01.png` … contiguously from 1.

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
