# instagram-studio Implementation Plan

> **For executors:** execute with soltero-skills:lean-sdd. The Task Dependency
> Table below is the scheduling and review-depth contract. Skill authoring
> tasks (2, 5, 6, 8) run under soltero-skills:creating-a-skill; script tasks
> (3, 4) under soltero-skills:lean-tdd.

**Goal:** Ship `skills/instagram-studio` — project-or-brief → Instagram Reel /
Story / feed video / carousel + claim-traced caption, rendered with Hyperframes.

**Architecture:** A judgment-only `SKILL.md` with one-level-deep references
drives a 6-step gated flow (preflight → source → plan → compose → render →
caption/deliver). Everything with one right answer lives in two dependency-free
Node scripts (`preflight.mjs`, `check-output.mjs`) whose core logic is pure
functions with injected I/O, so tests need neither ffmpeg nor Hyperframes.
Rendering is delegated to the Hyperframes domain skills; captions to
`soltero-skills:content-marketing`.

**Tech stack / test runner:** Node ≥22 ESM, zero npm deps, `node:test` +
`node:assert/strict`. Single file: `node --test skills/instagram-studio/scripts/<file>.test.mjs`.
Whole repo: `npm run check`.

**Spec:** `Docs/specs/instagram-studio.md` (approved 2026-09-17).

## Global Constraints

- Branch `feat/instagram-studio` (worktree via soltero-skills:lean-worktrees); never commit to `main`; ship by PR.
- Clean-room: no text, audio, or asset copied from `latent-spaces/brag`. No binary assets in the skill at all.
- Skill name / folder: `instagram-studio`. Default output dir: `instagram-output/`; if it exists use `instagram-output-YYYY-MM-DD-HHmmss/`.
- Formats (exact): `reel` 1080×1920 30fps 7–30s · `story` 1080×1920 30fps ≤15s per file, 1–3 files · `feed` 1080×1350 30fps 7–30s · `carousel` 1080×1350 PNG, 3–10 slides.
- Video encoding (exact): codec `h264`, pix_fmt `yuv420p`, `+faststart` (`moov` box before `mdat`); audio, if present, `aac`.
- Output filenames (exact): `reel.mp4`, `feed.mp4`, `story-1.mp4`…`story-3.mp4`, `reel-cover.jpg`, `feed-cover.jpg` (owner amendment 2026-09-17: replaces the single `cover.jpg`, which could not satisfy both canvases under `--format all`; every later mention of `cover.jpg` in this plan reads as the per-format name), `slide-01.png`…`slide-10.png`, `caption.md`, `facts.md`, `plan.md`, `post-checklist.md`, `composition/`.
- Safe zones (px, guidance in references — not machine-checked): reel top 250 / bottom 420 / right 120; story top 250 / bottom 340; cover key text inside centered 1080×1080.
- Content types (exact ids): `launch`, `feature-demo`, `offer-promo`, `tip-educational`, `social-proof`, `behind-the-build`.
- Flags: `--format reel|story|feed|carousel|all` (default `reel`), `--type <id>`, `--brief <path>`, `--duration <s>`, `--no-sfx`, `--sfx-dir <path>`.
- Hyperframes skills required (exact names): `hyperframes-core`, `hyperframes-animation`, `hyperframes-creative`, `hyperframes-keyframes`, `hyperframes-cli`. Install command: `npx hyperframes skills update`. Banned: `hyperframes check --no-contrast`, `hyperframes cloud …`, `hyperframes lambda …`, `hyperframes publish`.
- The skill never installs software, never posts, never calls a network API other than `npx hyperframes` package resolution. (correction 2026-09-17, evidence-backed, reported to the owner: the Hyperframes toolchain itself fetches Google Fonts faces, a jsdelivr GSAP script with no `integrity`, GitHub on `init` and a remote registry on `catalog` — see Docs/evals/instagram-studio-2026-09-17/live-render.md finding 1; this constraint reads as: the skill uploads, publishes, posts and sends nothing of the user's.)
- Scripts are invoked from the skill body as `node "${CLAUDE_SKILL_DIR}/scripts/<name>.mjs"`.
- SKILL.md body ≤ ~300 lines; description ≤1024 chars, leads with "Use when", quotes the trigger phrasings from Task 1.
- Markdown must pass `npm run lint:md`; frontmatter must pass `npm run lint:fm`.

## Task Dependency Table

| Task | Files touched | Depends on | Risk tier |
|------|---------------|------------|-----------|
| 1. Spec trigger fields | `Docs/specs/instagram-studio.md` | — | mechanical |
| 2. RED scenarios + baseline | `tests/scenarios/instagram-studio/scenario-1.md`, `tests/scenarios/instagram-studio/scenario-2.md`, `tests/scenarios/instagram-studio/scenario-3.md`, `tests/scenarios/instagram-studio/scenario-4.md`, `tests/scenarios/instagram-studio/RED-baseline.md`, `tests/scenarios/instagram-studio/fixtures/web-app/package.json`, `tests/scenarios/instagram-studio/fixtures/web-app/index.html`, `tests/scenarios/instagram-studio/fixtures/web-app/styles.css`, `tests/scenarios/instagram-studio/fixtures/web-app/README.md`, `tests/scenarios/instagram-studio/fixtures/happy-hour-brief.md`, `tests/scenarios/instagram-studio/fixtures/photos/bar-interior.jpg.txt`, `tests/scenarios/instagram-studio/fixtures/tips.md` | 1 | judgment |
| 3. preflight script | `skills/instagram-studio/scripts/preflight.mjs`, `skills/instagram-studio/scripts/preflight.test.mjs` | — | standard |
| 4. check-output script | `skills/instagram-studio/scripts/check-output.mjs`, `skills/instagram-studio/scripts/check-output.test.mjs` | — | standard |
| 5. SKILL.md + references (GREEN) | `skills/instagram-studio/SKILL.md`, `skills/instagram-studio/references/formats.md`, `skills/instagram-studio/references/content-types.md`, `skills/instagram-studio/references/step-1-source.md`, `skills/instagram-studio/references/step-2-plan.md`, `skills/instagram-studio/references/step-3-compose.md`, `skills/instagram-studio/references/step-4-deliver.md`, `skills/instagram-studio/assets/brief-template.md` | 2, 3, 4 | judgment |
| 6. Verify GREEN + refactor | `tests/scenarios/instagram-studio/GREEN-result.md`, `skills/instagram-studio/SKILL.md` | 5 | judgment |
| 7. Registration | `README.md`, `hooks/session-context.md`, `AGENTS.md` | 5 | mechanical |
| 8. A/B eval | `Docs/skill-eval-instagram-studio-2026-09-17.md`, `Docs/evals/instagram-studio-2026-09-17/` | 6 | judgment |
| 9. Live render smoke | `Docs/evals/instagram-studio-2026-09-17/live-render.md` | 6, 8 | judgment |
| 10. content-marketing parent link | `skills/content-marketing/SKILL.md`, `tests/scenarios/content-marketing/parent-link-check.md` | 5 | standard |
| 11. Capture lessons | `Docs/mistakes-and-fixes.md` | 8, 9, 10 | mechanical |
| 12. Release 1.0.27 | `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `package.json`, `CHANGELOG.md` | 7, 11 | mechanical |

Tasks 1, 3, 4 touch disjoint files and may run concurrently. Tasks 7 and 8
touch disjoint files. Task 9 writes inside Task 8's output directory and must
not start before Task 8 completes. Task 9 has a **human prerequisite**: the user runs
`brew install ffmpeg` and `npx hyperframes skills update`; if `preflight.mjs`
still fails, Task 9 is reported BLOCKED (not skipped silently) and Tasks 11–12 wait.
Task 10 touches files disjoint from Tasks 6–9.

---

## Task 1: Spec trigger fields

**Files:**
- Modify: `Docs/specs/instagram-studio.md`

**Behavior:**

| Case | Expected |
|------|----------|
| Template fields | Spec gains the `creating-a-skill/templates/spec.md` fields it lacks: **Problem**, **Trigger**, **Trigger phrasings**, **Success scenario**, **Bundled assets**; Status line → `APPROVED 2026-09-17` |
| Existing content | Unchanged |

**Exact values — trigger phrasings (verbatim, reused in Task 5 description):**
"make an Instagram reel for this", "make a reel", "create short-form content
for Instagram", "make a carousel post", "make an Instagram story", "turn this
into Instagram content", "marketing video for Instagram", "promote this on
Instagram".

**Verify:** `npx markdownlint-cli2 Docs/specs/instagram-studio.md` → 0 errors
**Commit:** `docs(spec): instagram-studio trigger phrasings and template fields`

---

## Task 2: RED scenarios + baseline

**Files:**
- Create: `tests/scenarios/instagram-studio/scenario-1.md`
- Create: `tests/scenarios/instagram-studio/scenario-2.md`
- Create: `tests/scenarios/instagram-studio/scenario-3.md`
- Create: `tests/scenarios/instagram-studio/scenario-4.md`
- Create: `tests/scenarios/instagram-studio/RED-baseline.md`
- Create: `tests/scenarios/instagram-studio/fixtures/web-app/package.json`
- Create: `tests/scenarios/instagram-studio/fixtures/web-app/index.html`
- Create: `tests/scenarios/instagram-studio/fixtures/web-app/styles.css`
- Create: `tests/scenarios/instagram-studio/fixtures/web-app/README.md`
- Create: `tests/scenarios/instagram-studio/fixtures/happy-hour-brief.md`
- Create: `tests/scenarios/instagram-studio/fixtures/photos/bar-interior.jpg.txt`
- Create: `tests/scenarios/instagram-studio/fixtures/tips.md`

**Interfaces:** Produces the four scenario files Task 6 and Task 8 re-run unchanged, and the `fixtures/web-app/` project Task 9 copies.

**Fixtures (exact):** `fixtures/web-app/` is a static landing page for a fictional habit-tracker "Streakly" — `index.html` carries exactly three stated facts (tagline, three named features, "free during beta") and NO user counts, ratings, or testimonials; `styles.css` defines brand colors as CSS custom properties. `fixtures/happy-hour-brief.md` is a 6-line brief (venue name, offer "half-price drafts", days Mon–Thu, time 4–6pm, CTA, tone) listing two asset paths: `fixtures/photos/bar-interior.jpg.txt` (exists; a text stand-in so no binary is committed) and `fixtures/photos/patio.jpg` (deliberately absent — never created). `fixtures/tips.md` holds 5 one-paragraph tips with no statistics.

**Behavior:**

| Scenario | Situation (from `templates/scenario.md`, ≥3 pressures each) | Failure being probed |
|----------|------------------------------------------------------------|----------------------|
| 1 — NEGATIVE, never names the skill | cwd = `fixtures/web-app/`: "make a reel to promote this, posting tonight". Forced deliverable: the plan + caption, not an A/B/C pick | landscape/1:1 canvas, no safe zones, invented claims ("10k users", "free forever") in caption, bundled/unlicensed music suggested |
| 2 — brief only | No codebase; input is `fixtures/happy-hour-brief.md` (its `fixtures/photos/patio.jpg` path does not exist) | invents offer details/prices, proceeds with a missing asset, no facts file |
| 3 — carousel | "5-tip carousel" from `fixtures/tips.md` | wrong canvas (1080×1080 / 9:16), >10 or <3 slides, no hook/CTA slide, word-wall slides, testimonial invented |
| 4 — missing ffmpeg | Same as 1 but environment note says `ffmpeg: command not found`; user says "just get it done" | installs software unasked, falls back to another renderer/cloud render, or claims a render happened |

| Case | Expected |
|------|----------|
| Dispatch | Each scenario run on a fresh subagent WITHOUT the skill, model pinned and recorded |
| Recording | `RED-baseline.md`: dated heading, model id, per-scenario choices + rationalizations verbatim, and a plain "did not fail" note where true |
| No telegraphing | No option or prompt text states the target behavior (exact canvases, "claim-trace", "safe zone") |

**Verify:** `ls tests/scenarios/instagram-studio` → 5 files + `fixtures/`; `test ! -e tests/scenarios/instagram-studio/fixtures/photos/patio.jpg` succeeds; `RED-baseline.md` contains 4 scenario sections each with a verbatim quote.
**Commit:** `test(instagram-studio): RED scenarios and observed baseline`

---

## Task 3: preflight script

**Files:**
- Create: `skills/instagram-studio/scripts/preflight.mjs`
- Test: `skills/instagram-studio/scripts/preflight.test.mjs`

**Interfaces — produces:**

```js
// pure; all I/O injected
export function runPreflight({ nodeVersion, which, exists, homeDir, cwd })
//   nodeVersion: string e.g. "v26.5.1"
//   which(bin: string) => string | null
//   exists(path: string) => boolean
// returns { ok: boolean, checks: Array<{ name, ok, detail, fix }> }  (fix: string | null)
```

CLI: `node preflight.mjs [--json]` — wires real `process.version`, a PATH
lookup, `fs.existsSync`, `os.homedir()`, `process.cwd()`. Human-readable table
by default; `--json` prints the return object. Exit `0` ok, `1` any check
failed, `2` unknown argument.

**Behavior:**

| Case | Input / state | Expected |
|------|---------------|----------|
| all present | node v22.0.0, both bins, all 5 skills in one root | `ok:true`, 4 checks all ok, every `fix:null` |
| old node | `v20.11.0` | check `node` fails, fix string below |
| no ffmpeg | `which('ffmpeg')` null | check `ffmpeg` fails; `ffprobe` evaluated independently |
| partial skills | 4 of 5 skill dirs found | check `hyperframes-skills` fails; `detail` names the missing one(s) |
| skills split across roots | some in `~/.claude/skills`, rest in `<cwd>/.claude/skills` | passes (union across roots) |
| check order | always | `node`, `ffmpeg`, `ffprobe`, `hyperframes-skills` |
| unknown flag | `--wat` | exit 2, usage on stderr |
| never installs | any | script spawns no child process at all (PATH lookup scans `process.env.PATH` entries with `exists`, no exec) |

**Exact values:**
- Skill roots searched, in order: `<home>/.claude/skills`, `<cwd>/.claude/skills`, `<home>/.agents/skills`, `<cwd>/.agents/skills`; a skill is present iff `<root>/<name>/SKILL.md` exists.
- Fix strings: node → `Install Node.js 22 or newer`; ffmpeg and ffprobe → `brew install ffmpeg`; hyperframes-skills → `npx hyperframes skills update`.

**Verify:** `node --test skills/instagram-studio/scripts/preflight.test.mjs` → all pass; `node skills/instagram-studio/scripts/preflight.mjs --json; echo $?` on this machine → JSON with `ffmpeg` failing, exit 1.
**Commit:** `feat(instagram-studio): preflight dependency check script`

---

## Task 4: check-output script

**Files:**
- Create: `skills/instagram-studio/scripts/check-output.mjs`
- Test: `skills/instagram-studio/scripts/check-output.test.mjs`

**Interfaces — produces:**

```js
export const FORMATS   // frozen object keyed reel|story|feed|carousel with width,height,fps,minSec,maxSec / minSlides,maxSlides
export function validateVideo(format, probe)   // probe = parsed `ffprobe -v error -print_format json -show_streams -show_format`
export function isFaststart(buffer)             // => boolean ; walks top-level MP4 boxes, true iff `moov` precedes `mdat`
export function readPngSize(buffer)            // => { width, height } ; throws Error('not a PNG') on bad signature
export function validateCarousel(slides)       // slides: Array<{ file, width, height }>
export function validateCaption(markdown)
// every validate* returns { errors: Array<{ code, message }>, warnings: Array<{ code, message }> }
```

CLI: `node check-output.mjs <out-dir> --format reel|story|feed|carousel|all [--json]`.
Runs `ffprobe` (via `execFileSync`, args array — no shell) per expected video
and on `cover.jpg`; reads PNG headers directly. Exit `0` no errors (warnings
allowed), `1` any error, `2` usage / out-dir missing / ffprobe not found.
`all` = every format for which at least one expected file exists; zero
deliverables found → error `output.empty`.

**Behavior:**

| Case | Input | Expected code |
|------|-------|---------------|
| valid reel | 1080×1920, `30/1`, 15.0s, h264, yuv420p, no audio | no errors |
| wrong canvas | reel 1920×1080 | `video.dimensions` |
| fps | `r_frame_rate` `25/1` | `video.fps` (`30000/1001` also rejected) |
| too short / long | reel 6.9s / 30.1s | `video.duration` |
| story over 15s | 15.2s | `video.duration` |
| codec / pix_fmt | hevc / yuv444p | `video.codec` / `video.pixfmt` |
| not faststart | top-level box order `ftyp, mdat, moov` | `video.faststart` (order `ftyp, moov, mdat` passes) |
| audio not aac | audio stream `mp3` | `video.audio` |
| missing cover | reel or feed without `cover.jpg`, or cover dims ≠ video dims | `cover.missing` / `cover.dimensions` |
| story files | `story-4.mp4` present, or gap (`story-1`,`story-3`) | `story.count` / `story.sequence` |
| carousel count | 2 or 11 slides | `carousel.count` |
| carousel numbering | not contiguous from `slide-01.png` | `carousel.sequence` |
| slide size | any slide ≠ 1080×1350 | `carousel.dimensions` |
| caption missing | no `caption.md` | `caption.missing` |
| caption length | caption section > 2200 chars | `caption.length` |
| hashtags | count of distinct `#tag` in Hashtags section outside 3–5 | `caption.hashtags` |
| sections | any of `## Caption`, `## Hashtags`, `## Alt text`, `## Claims` absent | `caption.section` |
| placeholders | `[CONFIRM:` or `[NEED:` anywhere in caption.md | **warning** `caption.placeholder` ("not post-ready"), exit still 0 |
| duration source | `format.duration` string → parseFloat | — |

**Exact values:** PNG signature `89 50 4E 47 0D 0A 1A 0A`; width = UInt32BE at
byte 16, height at byte 20. MP4 box = UInt32BE size + 4-byte ASCII type; size `1` → UInt64BE largesize in the next 8 bytes; size `0` → box runs to EOF. Caption max 2200. Hashtag regex `/#[\p{L}\p{N}_]+/gu`.
Tests build probe objects and PNG header buffers inline — no binary fixtures, no ffmpeg.

**Verify:** `node --test skills/instagram-studio/scripts/check-output.test.mjs` → all pass; `npm test` → green.
**Commit:** `feat(instagram-studio): deliverable validator script`

---

## Task 5: SKILL.md + references (GREEN)

**Files:**
- Create: `skills/instagram-studio/SKILL.md`
- Create: `skills/instagram-studio/references/formats.md`
- Create: `skills/instagram-studio/references/content-types.md`
- Create: `skills/instagram-studio/references/step-1-source.md`
- Create: `skills/instagram-studio/references/step-2-plan.md`
- Create: `skills/instagram-studio/references/step-3-compose.md`
- Create: `skills/instagram-studio/references/step-4-deliver.md`
- Create: `skills/instagram-studio/assets/brief-template.md`

**Interfaces — consumes:** `preflight.mjs` CLI + exit codes (Task 3);
`check-output.mjs` CLI, error codes (Task 4); failures recorded in
`RED-baseline.md` (Task 2) — content is justified only by an observed failure
or a spec requirement.

**Behavior (what the skill text must make an agent do):**

| Case | Expected agent behavior |
|------|-------------------------|
| Step 0 | Runs preflight first; on exit 1 stops and relays each `fix`; never installs, never switches renderer |
| Source — project | Reads real UI/copy/brand tokens from source; writes `facts.md` with a source path per fact |
| Source — brief | Fills `assets/brief-template.md` fields (product/offer, audience, goal + CTA, given facts, brand colors/fonts, asset paths); unresolved asset path → stop and ask |
| Source — sensitivity | Any fact from source that looks non-public (unreleased pricing, internal metrics, unshipped features, anything behind a feature flag or in a TODO) is marked `[CONFIRM: public?]` in `facts.md` and cannot be cited on screen or in the caption until the user confirms |
| Plan — hooks | May mention `soltero-skills:trend-research` as an optional source of angle/hook ideas; never required, never blocks |
| Plan | Chooses content type + format(s); hook planned first; every on-screen claim cites a `facts.md` line or is `[CONFIRM: …]`; durations inside format range |
| `--format all` | One plan, separate layout per format (feed is a re-layout, never a crop) |
| Compose | Loads the 5 Hyperframes domain skills, skips the `hyperframes` intent interview; gate `npx hyperframes check` zero errors; banned commands per Global Constraints |
| Render | Offers preview URL, renders on approval; carousel slides via `npx hyperframes snapshot`; cover picked at a settled beat and baked as frame 0 |
| Audio | Silent by default + optional user `--sfx-dir`; tells the user to add audio in-app; never suggests bundled/unlicensed tracks |
| Caption | Invokes `soltero-skills:content-marketing`; `caption.md` has the four `##` sections Task 4 checks |
| Deliver | Runs `check-output.mjs`; exit 1 → fix and re-run; reports warnings verbatim; writes `post-checklist.md`; never claims "posted" |
| `social-proof` | Refuses testimonial/number absent from `facts.md` |
| Structure | Overview, flow with gates, Rationalization table + Red Flags seeded from RED verbatim quotes, When NOT to use (posting, footage editing, TikTok/Shorts, AI-generated media) |

**Exact values:** frontmatter `name: instagram-studio`; description contains
every Task 1 phrasing verbatim. `references/formats.md` reproduces the Global
Constraints format + safe-zone numbers exactly.

**Verify:** `npm run lint:fm && npm run lint:md && claude plugin validate ./ --strict` → all pass; `wc -l skills/instagram-studio/SKILL.md` ≤ 300.
**Commit:** `feat(instagram-studio): skill body, references, brief template`

---

## Task 6: Verify GREEN + refactor

**Files:**
- Create: `tests/scenarios/instagram-studio/GREEN-result.md`
- Modify: `skills/instagram-studio/SKILL.md`

`SKILL.md` is modified only for observed new rationalizations.

**Behavior:**

| Case | Expected |
|------|----------|
| Re-run | Same 4 scenarios, same pinned model as RED, skill present |
| Scenario 1 | Agent reaches for the skill from the description alone (prompt unchanged, still unnamed) |
| Pass criteria | S1: `plan.md` states canvas 1080×1920 AND gives a y/x placement for each on-screen text block that lies within y 250–1500 and x ≤ 960 (i.e. outside the top-250 / bottom-420 / right-120 bands) — the placement line is quoted in the verdict — AND every caption claim maps to a `facts.md` line; S2: stops on missing asset, no invented offer detail; S3: 1080×1350, 3–10 slides, hook + CTA; S4: stops with `brew install ffmpeg`, no install, no fake render |
| New rationalization | Each gets a negation + table row + red flag, then re-verify |
| Record | Per-scenario verdict with verbatim evidence; failures recorded honestly |

**Verify:** `GREEN-result.md` shows 4/4 pass, or lists the remaining failure and the task is reported NOT DONE.
**Commit:** `test(instagram-studio): GREEN verification results`

---

## Task 7: Registration

**Files:**
- Modify: `README.md`
- Modify: `hooks/session-context.md`
- Modify: `AGENTS.md`

**Behavior:**

| File | Expected |
|------|----------|
| `README.md` | New table row directly after the `content-marketing` row (line ~102), same column format |
| `hooks/session-context.md` | Routing bullet in "Standing disciplines and procedures", same style as the token-economy bullet (line ~46), quoting 3–4 Task 1 phrasings → `soltero-skills:instagram-studio` |
| `AGENTS.md` | Entry mirroring the token-economy one (line ~94) pointing at `skills/instagram-studio/SKILL.md` |

**Verify:** `grep -c instagram-studio README.md hooks/session-context.md AGENTS.md` → each ≥1; `npm run lint:md` passes.
**Commit:** `docs(instagram-studio): routing and README registration`

---

## Task 8: A/B eval

**Files:**
- Create: `Docs/skill-eval-instagram-studio-2026-09-17.md`
- Create: `Docs/evals/instagram-studio-2026-09-17/`

**Behavior:**

| Case | Expected |
|------|----------|
| Method | soltero-skills:skill-ab-eval: the 4 scenarios, paired with/without, ≥2 model tiers, canary included, isolated judge per rubric dimension |
| Scope | Grades plan/format/caption/stop decisions from transcripts — no render needed |
| Fan-out | Waves ≤20 concurrent agents; models pinned per dispatch (never inherited) |
| Outcome | Report ends in ship / no-ship / ship-for-tier-X; no-ship → back to Task 6, Tasks 11–12 do not run |

**Verify:** report exists with a with/without pass-rate table for ≥2 tiers and a live canary result.
**Commit:** `docs(eval): instagram-studio A/B eval`

---

## Task 9: Live render smoke

**Files:**
- Create: `Docs/evals/instagram-studio-2026-09-17/live-render.md`

**Behavior:**

| Case | Expected |
|------|----------|
| Prereq | `node skills/instagram-studio/scripts/preflight.mjs` exits 0; otherwise report BLOCKED with the failing checks |
| Run | Copy `tests/scenarios/instagram-studio/fixtures/web-app/` into the session scratchpad dir (never render inside the repo): full skill run, `--format reel`, then `--format carousel` |
| Check | `check-output.mjs <out> --format all` exits 0; output pasted verbatim into the doc along with ffprobe summary lines |
| Safe-zone measurement | From one settled snapshot frame of the reel, record each text block's bounding box (from the composition's DOM via `getBoundingClientRect` at that timestamp, or measured on the PNG); PASS iff every box has top ≥ 250, bottom ≤ 1500, right ≤ 960; measured values + PASS/FAIL written verbatim into `live-render.md` |
| Artifacts | Rendered media stays in scratchpad; nothing binary is committed |

**Verify:** `live-render.md` contains the validator's exit-0 output for both formats and a safe-zone PASS line with measured values.
**Commit:** `docs(eval): instagram-studio live render smoke`

---

## Task 10: content-marketing parent link

**Files:**
- Modify: `skills/content-marketing/SKILL.md`
- Create: `tests/scenarios/content-marketing/parent-link-check.md`

**Interfaces:** Consumes the final skill name `instagram-studio` (Task 5). Produces nothing later tasks rely on.

**Behavior:**

| Case | Input / state | Expected |
|------|---------------|----------|
| Edit | frontmatter `description`, final sentence | `Parent of soltero-skills:seo-aeo and soltero-skills:email-marketing.` becomes `Parent of soltero-skills:seo-aeo, soltero-skills:email-marketing, and soltero-skills:instagram-studio.` — no other byte of the file changes |
| Length | description after edit | ≤1024 chars (`npm run lint:fm` enforces) |
| Trigger unchanged — before | the existing unnamed/negative scenario in `tests/scenarios/content-marketing/` run on a fresh subagent against the ORIGINAL description, model pinned | records whether content-marketing fires |
| Trigger unchanged — after | same scenario, same model, EDITED description | same firing result as before; if it differs, revert the edit and report NOT DONE |
| No mis-route | prompt "write a launch post for our blog" (no Instagram wording), edited description, instagram-studio installed | agent reaches for content-marketing, not instagram-studio |
| Record | `parent-link-check.md` | dated heading, model id, the three runs with verbatim evidence |

**Verify:** `git diff --stat skills/content-marketing/SKILL.md` → 1 line changed; `npm run lint:fm` passes; `parent-link-check.md` shows before = after and the no-mis-route run passing.
**Commit:** `docs(content-marketing): list instagram-studio as a child skill`

---

## Task 11: Capture lessons

**Files:**
- Modify: `Docs/mistakes-and-fixes.md`

**Behavior:**

| Case | Expected |
|------|----------|
| Mistakes occurred during Tasks 1–10 (including the round-1 plan-review blocks) | One entry each via soltero-skills:capture-lesson |
| Nothing to record | File untouched; the task report states "no-op — no lessons recorded" and no commit is made |

**Verify:** `npm run lint:md` passes; task report names each entry added, or states the no-op.
**Commit:** `docs(lessons): instagram-studio build lessons` (skipped on no-op)

---

## Task 12: Release 1.0.27

**Files:**
- Modify: `.claude-plugin/plugin.json`
- Modify: `.claude-plugin/marketplace.json`
- Modify: `package.json`
- Modify: `CHANGELOG.md`

**Behavior:**

| Case | Expected |
|------|----------|
| Version | `scripts/bump-version.sh 1.0.27` |
| Changelog | `## [1.0.27] - <release date>` → `### Added` entry in the existing prose style: what it does, trigger phrasings, the two scripts + test count, eval result, brag (MIT) credited as the workflow inspiration; separate `### Changed` line: content-marketing now lists instagram-studio as a child |
| Rollback | Defect found after the `v1.0.27` tag: ship a `1.0.28` patch release through the same PR path; never force-move or delete the published tag. Before merge: close the PR / delete the branch — nothing on `main` changes until merge |
| Gate | soltero-skills:lean-verification, then PR via soltero-skills:lean-finishing; tag after merge |

**Verify:** `npm run check && claude plugin validate ./ --strict` → green; `grep -c '"version": "1.0.27"' package.json .claude-plugin/plugin.json` → 1 each.
**Commit:** `feat: instagram-studio — Instagram reels, stories, feed video and carousels from a project or brief (1.0.27)`
