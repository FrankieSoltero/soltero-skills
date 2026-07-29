import { LANE_WIDTH, type GameEngine } from "./engine";

export const DOODLE_ROWS = 20;
export const PLAT_W = 5;

const GRAVITY = 34; // rows / s²
const BOUNCE_V = 17; // rows / s — upward impulse on contact
/** Terminal cells are ~2× taller than wide, so horizontal travel needs roughly
 *  double the rate to feel isotropic (snake.ts makes the same correction). */
const MOVE_SPEED = 26; // cols / s
/** Player rises above this line from the view bottom → the camera follows. */
const SCROLL_LINE = DOODLE_ROWS - DOODLE_ROWS / 3;
const GAP_MIN = 2.2;
/** Must stay below the bounce apex (BOUNCE_V² / 2·GRAVITY ≈ 4.25 rows) or a
 *  generated platform becomes unreachable and the run is unwinnable. */
const GAP_MAX = 3.6;
const MAX_SCORE = 99999; // server MAX_GAME_SCORE

export interface Platform {
  x: number;
  /** world altitude, increasing upward */
  y: number;
}

export interface DoodleState {
  /** column, 0 ≤ x < LANE_WIDTH, wraps */
  x: number;
  /** world altitude, increasing upward */
  y: number;
  vy: number;
  /** steer direction; keydown-only input, so it persists until changed */
  dir: -1 | 0 | 1;
  /** world altitude at the BOTTOM of the visible band */
  cam: number;
  platforms: Platform[];
  /** high-water altitude — the score */
  best: number;
  alive: boolean;
}

const platX = () => Math.floor(Math.random() * (LANE_WIDTH - PLAT_W + 1));
const gap = () => GAP_MIN + Math.random() * (GAP_MAX - GAP_MIN);

/** Extend `platforms` upward until the topmost one is above `ceiling`. `floor`
 *  is where generation starts when the list is empty or entirely below it —
 *  callers pass the TOP of the visible band so a platform can never pop into
 *  view underneath the player. */
function generate(platforms: Platform[], floor: number, ceiling: number): Platform[] {
  const out = [...platforms];
  let top = out.reduce((m, p) => Math.max(m, p.y), floor);
  while (top < ceiling) {
    top += gap();
    out.push({ x: platX(), y: top });
  }
  return out;
}

export function initialState(_seed = 1): DoodleState {
  const platforms = generate([{ x: 8, y: 1 }], 1, DOODLE_ROWS * 2);
  return { x: 10, y: 2, vy: 0, dir: 0, cam: 0, platforms, best: 2, alive: true };
}

export function tick(s: DoodleState, dt: number): DoodleState {
  if (!s.alive) return s;

  let vy = s.vy - GRAVITY * dt;
  let y = s.y + vy * dt;

  let x = s.x + s.dir * MOVE_SPEED * dt;
  if (x < 0) x += LANE_WIDTH;
  if (x >= LANE_WIDTH) x -= LANE_WIDTH;

  // Bounce only while descending across a platform's top edge — a rising
  // player passes straight through, which is what makes the game work.
  if (vy < 0) {
    const col = Math.floor(x);
    for (const p of s.platforms) {
      if (s.y >= p.y && y <= p.y && col >= p.x && col < p.x + PLAT_W) {
        y = p.y;
        vy = BOUNCE_V;
        break;
      }
    }
  }

  let cam = s.cam;
  if (y - cam > SCROLL_LINE) cam = y - SCROLL_LINE;

  const platforms = generate(
    s.platforms.filter((p) => p.y >= cam - 1),
    cam + DOODLE_ROWS, // never generate inside the visible band
    cam + DOODLE_ROWS * 2,
  );

  return {
    ...s,
    x, y, vy, cam, platforms,
    best: Math.max(s.best, y),
    alive: y >= cam - 1,
  };
}

export function input(s: DoodleState, key: string): DoodleState {
  if (!s.alive) return s;
  if (key === "ArrowLeft") return { ...s, dir: -1 };
  if (key === "ArrowRight") return { ...s, dir: 1 };
  if (key === "ArrowDown" || key === "ArrowUp") return { ...s, dir: 0 };
  return s;
}

export function renderView(s: DoodleState): string[] {
  const rows = Array.from({ length: DOODLE_ROWS }, () =>
    Array<string>(LANE_WIDTH).fill(" "),
  );
  const rowOf = (y: number) => DOODLE_ROWS - 1 - Math.round(y - s.cam);

  for (const p of s.platforms) {
    const r = rowOf(p.y);
    if (r < 0 || r >= DOODLE_ROWS) continue;
    for (let i = 0; i < PLAT_W; i++) {
      const c = p.x + i;
      if (c >= 0 && c < LANE_WIDTH) rows[r][c] = "▔";
    }
  }

  const pr = rowOf(s.y);
  const pc = Math.floor(s.x);
  if (pr >= 0 && pr < DOODLE_ROWS && pc >= 0 && pc < LANE_WIDTH) {
    rows[pr][pc] = s.alive ? "@" : "✖";
  }
  return rows.map((r) => r.join(""));
}

export const doodleEngine: GameEngine<DoodleState> = {
  key: "doodlejump",
  label: "DOODLE JUMP",
  rows: DOODLE_ROWS,
  init: initialState,
  tick,
  input,
  render: renderView,
  score: (s) => Math.min(MAX_SCORE, Math.floor(s.best)),
  over: (s) => !s.alive,
  hint: (_s, playing) =>
    playing
      ? "← → STEER · ↓ STOP · bouncing is automatic"
      : "SPACE to play · ← → steer, bouncing is automatic",
};
