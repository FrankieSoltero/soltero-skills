# instagram-studio — design spec

Date: 2026-09-17 · Status: APPROVED 2026-09-17 · Author: Claude (lean-brainstorming)

> **Amendment 2026-09-17 (owner ruling).** Covers are **per format**:
> `reel-cover.jpg` (1080×1920) and `feed-cover.jpg` (1080×1350). One
> `cover.jpg` could not satisfy both canvases under `--format all`. Every
> later mention of `cover.jpg` in this spec reads as the per-format name.

- **Problem:** Turning a code project or a written brief into ready-to-post
  Instagram marketing content (Reels, Stories, feed video, carousels)
  currently means manual editing, captioning, and format/safe-zone
  guesswork, with no repeatable, clean-room workflow for it.
- **Trigger:** A user wants short-form marketing content generated for
  Instagram from a project or brief — Reels, Stories, feed video, or
  carousels — complete with caption, hashtags, cover image, and a posting
  checklist.
- **Trigger phrasings:** "make an Instagram reel for this", "make a reel",
  "create short-form content for Instagram", "make a carousel post", "make
  an Instagram story", "turn this into Instagram content", "marketing video
  for Instagram", "promote this on Instagram".
- **Success scenario:** Given a code project (or brief), the skill
  preflights dependencies, extracts `facts.md`, plans a beat-by-beat
  storyboard, composes via Hyperframes, renders format-correct
  MP4s/PNGs (safe zones, exact durations, h264/yuv420p/+faststart), and
  delivers `caption.md`, `cover.jpg`, and `post-checklist.md` with every
  on-screen claim traced to `facts.md`.
- **Bundled assets:** `references/` (formats.md, step-1-source.md through
  step-4-deliver.md, content-types.md), `scripts/` (preflight.mjs,
  check-output.mjs), `assets/brief-template.md`.

## Goal

One skill that turns a code project **or** a written brief into ready-to-post
Instagram marketing content — Reels, Stories, 4:5 feed video, and carousels —
with caption, hashtags, cover image, and a posting checklist. Clean-room
recreation of the *workflow idea* in latent-spaces/brag (MIT), rewritten for
Instagram; no brag text, music, or SFX files are copied.

## Decisions taken in the question round

<!-- markdownlint-disable MD013 -->
| Decision | Choice |
|---|---|
| Input | Code project when present, otherwise brief + supplied assets |
| Renderer | Hyperframes CLI (`npx hyperframes`, Apache-2.0, local render, no account) |
| Formats | Reel 9:16, Story 9:16, Feed video 4:5, Carousel 4:5 stills |
| Music | None bundled. Render silent (optional SFX); user adds audio in Instagram |
<!-- markdownlint-enable MD013 -->

## Verified facts about the dependency

- `hyperframes` npm 0.8.46, Apache-2.0, github.com/heygen-com/hyperframes,
  renders locally to MP4.
- Domain skills install non-interactively with `npx hyperframes skills
  update` (core set).
- `npx hyperframes snapshot` exports PNG frames — this is the carousel export path.
- Requires Node 22+ (have v26) and ffmpeg on PATH (**not installed on this machine**).
- Cloud/Lambda rendering exists but is never used by this skill.

## Shape

<!-- markdownlint-disable MD013 -->
```text
skills/instagram-studio/
  SKILL.md                      # dispatch, 5 steps with gates, creative laws
  references/
    formats.md                  # per-format spec table (below) + safe zones
    step-1-source.md            # project inspect OR brief intake
    step-2-plan.md              # angle, hook, storyboard / slide outline
    step-3-compose.md           # brief handed to Hyperframes domain skills
    step-4-deliver.md           # render, cover, caption, checklist
    content-types.md            # 6 marketing archetypes (below)
  scripts/
    preflight.mjs               # node/ffmpeg/hyperframes/skills check → JSON, exit code
    check-output.mjs            # ffprobe-based deliverable validator → JSON, exit code
  assets/brief-template.md
tests/scenarios/instagram-studio/   # per creating-a-skill
```
<!-- markdownlint-enable MD013 -->

## Flow (each step has a gate)

0. **Preflight** — `preflight.mjs`. Missing ffmpeg or Hyperframes skills → stop
   and print the exact install command (`brew install ffmpeg`,
   `npx hyperframes skills update`). Never silently degrades, never installs
   on its own.
1. **Source** — if the cwd is a code project, read UI/copy/brand tokens from
   source; otherwise fill `brief-template.md` (product/offer, audience, goal +
   CTA, given facts, brand colors/fonts, asset paths). Both produce the same
   `facts.md` — the *only* allowed source of claims. Gate: facts.md exists;
   every asset path resolves.
2. **Plan** — pick content type + format(s), write `plan.md`: hook (first 2s /
   slide 1), beat-by-beat storyboard or slide outline, on-screen text, CTA.
   Gate: durations inside the format's range; every on-screen claim cites a
   facts.md line or is a `[CONFIRM: …]` placeholder.
3. **Compose** — write the composition brief; build in `<out>/composition/`
   using `hyperframes-core/-animation/-creative/-keyframes/-cli` (skips the
   `hyperframes` intent interview, like brag does). Gate: `npx hyperframes
   check` zero errors.
4. **Render** — preview URL offered first; render on approval. Reels/Stories/
   feed → MP4; carousel → one PNG per slide via `snapshot`. Cover frame picked
   at a settled beat and baked as frame 0.
5. **Caption + deliver** — caption, hashtags, alt text written under
   `soltero-skills:content-marketing`'s claim-trace gate (claims table
   included). `check-output.mjs` validates files. Gate: validator exits 0.

## Format table (exact values the validator enforces)

<!-- markdownlint-disable MD013 -->
| Format | Canvas | Duration | Output | Notes |
|---|---|---|---|---|
| reel | 1080×1920, 30fps | 7–30s (default 12–20s) | reel.mp4 + cover.jpg | key text inside safe zone: top 250px / bottom 420px / right 120px clear |
| story | 1080×1920, 30fps | ≤15s per frame, 1–3 frames | story-N.mp4 | top 250px / bottom 340px clear; leave sticker/link space |
| feed | 1080×1350, 30fps | 7–30s | feed.mp4 + cover.jpg | re-layout of the reel, not a crop |
| carousel | 1080×1350 PNG | 3–10 slides | slide-NN.png | slide 1 = hook, last = CTA; ≤ ~25 words/slide |
<!-- markdownlint-enable MD013 -->

All video: H.264, yuv420p, +faststart, AAC if audio present. Cover also
checked against the 1:1 center crop of the profile grid (key text inside the
center 1080×1080).

## Content types (replace brag's joke-leaning tone presets)

`launch` · `feature-demo` · `offer-promo` · `tip-educational` ·
`social-proof` · `behind-the-build`. Each defines hook patterns, pacing, and
CTA style. Freeform creative direction still allowed. `social-proof` refuses
to render a testimonial/number not in facts.md.

## Invocation

Natural language or flags: `--format reel|story|feed|carousel|all` (default
`reel`), `--type <content-type>`, `--brief <path>`, `--duration <s>`,
`--no-sfx`. Output to `instagram-output/` (timestamped if one exists):
`facts.md, plan.md, composition/, reel.mp4, cover.jpg, slide-NN.png,
caption.md (caption + hashtags + alt text + claims table), post-checklist.md`.

## Defaults I chose (flagging as decisions)

- Name `instagram-studio`; child of `content-marketing` (listed in its
  "Parent of" line).
- SFX: none bundled in v1 (keeps repo light, zero license surface);
  `--sfx-dir` accepts user-supplied files. brag's Kenney pack is CC0 and
  could be added later.
- No voiceover in v1. No burned-in auto-captions of speech (there is no
  speech); on-screen text is the caption.
- Hashtags: 3–5 specific tags, no banned/generic mega-tags list lookup (no
  network). Optional hand-off to `trend-research` for angle/hook ideas is
  mentioned, not required.
- Never posts to Instagram, never touches an account or API. Deliverable
  is files + checklist ("add audio in-app, upload cover, paste caption").
- `--format all` plans once, then composes each format as its own layout.

## Error handling

Preflight failures stop with the fix command. Missing asset → stop at step 1.
`hyperframes check` failures are fixed, never bypassed (`--no-contrast` banned).
Render failure → report the CLI output; no fallback renderer.

## Testing / shipping (per creating-a-skill)

- Baseline scenarios observed failing without the skill: (a) agent asked for
  "an Instagram reel for my app" produces landscape/unsafe-zone video or
  invents claims in caption; (b) brief-only input; (c) carousel request;
  (d) missing-ffmpeg preflight.
- `preflight.mjs` and `check-output.mjs` get unit tests (fixtures: a tiny
  generated MP4/PNG) under lean-tdd.
- skill-ab-eval with/without on two model tiers before release. Full render
  eval needs ffmpeg installed — **you run `brew install ffmpeg`** before that stage.
- Version bump + CHANGELOG + README skill list, via PR from a feature branch.

## Out of scope (v1)

Posting/scheduling, analytics, talking-head/footage editing, AI-generated
images/video/voice, TikTok/Shorts variants, bundled music.

## Alternatives considered

- Remotion / self-built Playwright renderer — rejected in question round.
- Four separate skills per format — rejected: shared source/plan/caption steps
  would be duplicated; one skill with a format table is smaller.
