import { LANE_WIDTH, type GameEngine } from "./engine";

export const WELL_W = 10;
export const WELL_H = 18;
/** 1 top border + playfield + 1 bottom border */
export const TETRIS_ROWS = WELL_H + 2;

/** Terminal cells are ~2× taller than wide (snake.ts compensates in time via
 *  V_ASPECT; Tetris compensates in space): one well cell renders 2 chars wide. */
const CELL = 2;
const HUD_W = LANE_WIDTH - (WELL_W * CELL + 2);
const MAX_SCORE = 99999; // server MAX_GAME_SCORE — a larger score is rejected outright
const BASE_DROP = 0.8; // seconds per gravity step at level 0
const DROP_PER_LEVEL = 0.07;
const MIN_DROP = 0.08;
const LINE_SCORES = [0, 40, 100, 300, 1200] as const;

export type Piece = "I" | "O" | "T" | "S" | "Z" | "J" | "L";

/** Spawn rotation of each tetromino as cells in a 4×4 box. Rotations are
 *  computed, not tabulated — see `rotate`. */
export const SHAPES: Record<Piece, [number, number][]> = {
  I: [[0, 1], [1, 1], [2, 1], [3, 1]],
  O: [[1, 0], [2, 0], [1, 1], [2, 1]],
  T: [[1, 0], [0, 1], [1, 1], [2, 1]],
  S: [[1, 0], [2, 0], [0, 1], [1, 1]],
  Z: [[0, 0], [1, 0], [1, 1], [2, 1]],
  J: [[0, 0], [0, 1], [1, 1], [2, 1]],
  L: [[2, 0], [0, 1], [1, 1], [2, 1]],
};

export interface ActivePiece {
  kind: Piece;
  /** cells relative to the piece origin, normalized to min x = min y = 0 */
  cells: [number, number][];
  x: number;
  y: number;
}

export interface TetrisState {
  /** [row][col]; null is empty. Row 0 is the top of the well. */
  well: (Piece | null)[][];
  active: ActivePiece | null;
  bag: Piece[];
  next: Piece;
  dropAcc: number;
  lines: number;
  score: number;
  alive: boolean;
}

export function normalize(cells: [number, number][]): [number, number][] {
  const minX = Math.min(...cells.map((c) => c[0]));
  const minY = Math.min(...cells.map((c) => c[1]));
  return cells.map(([x, y]) => [x - minX, y - minY] as [number, number]);
}

/** Clockwise quarter turn inside the piece's own bounding box. No wall kicks:
 *  a rotation that would not fit is simply rejected by `input`. */
export function rotate(cells: [number, number][]): [number, number][] {
  const maxY = Math.max(...cells.map((c) => c[1]));
  return normalize(cells.map(([x, y]) => [maxY - y, x] as [number, number]));
}

const ALL: Piece[] = ["I", "O", "T", "S", "Z", "J", "L"];

/** 7-bag: shuffle all seven, deal until empty, refill. Guarantees no long
 *  droughts without tracking history. Uses Math.random by design — these two
 *  engines are deliberately not seed-deterministic (spec §3.4). */
export function refill(): Piece[] {
  const bag = [...ALL];
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  return bag;
}

function draw(bag: Piece[]): { kind: Piece; bag: Piece[] } {
  const b = bag.length ? bag : refill();
  return { kind: b[0], bag: b.slice(1) };
}

export function spawn(kind: Piece): ActivePiece {
  const cells = normalize(SHAPES[kind]);
  const w = Math.max(...cells.map((c) => c[0])) + 1;
  return { kind, cells, x: Math.floor((WELL_W - w) / 2), y: 0 };
}

export function collides(
  well: (Piece | null)[][],
  p: ActivePiece,
  dx = 0,
  dy = 0,
  cells: [number, number][] = p.cells,
): boolean {
  return cells.some(([cx, cy]) => {
    const x = p.x + dx + cx;
    const y = p.y + dy + cy;
    if (x < 0 || x >= WELL_W || y >= WELL_H) return true;
    if (y < 0) return false; // above the well is free space
    return well[y][x] !== null;
  });
}

export const level = (s: TetrisState): number => Math.floor(s.lines / 10);

/** Freeze the active piece into the well, clear full rows, and spawn the next
 *  piece. A spawn that collides ends the run. */
export function lockPiece(s: TetrisState): TetrisState {
  if (!s.active) return s;
  const well = s.well.map((r) => [...r]);
  for (const [cx, cy] of s.active.cells) {
    const x = s.active.x + cx;
    const y = s.active.y + cy;
    if (y >= 0 && y < WELL_H && x >= 0 && x < WELL_W) well[y][x] = s.active.kind;
  }
  const kept = well.filter((r) => r.some((c) => c === null));
  const cleared = WELL_H - kept.length;
  while (kept.length < WELL_H) kept.unshift(Array<Piece | null>(WELL_W).fill(null));

  const gained = LINE_SCORES[cleared] * (level(s) + 1);
  const active = spawn(s.next);
  const { kind, bag } = draw(s.bag);
  const alive = !collides(kept, active);

  return {
    well: kept,
    active: alive ? active : null,
    bag,
    next: kind,
    dropAcc: 0,
    lines: s.lines + cleared,
    score: Math.min(MAX_SCORE, s.score + gained),
    alive,
  };
}

export function stepDown(s: TetrisState): TetrisState {
  if (!s.alive || !s.active) return s;
  if (!collides(s.well, s.active, 0, 1)) {
    return { ...s, active: { ...s.active, y: s.active.y + 1 } };
  }
  return lockPiece(s); // immediate lock, no lock delay
}

export function tick(s: TetrisState, dt: number): TetrisState {
  if (!s.alive || !s.active) return s;
  const interval = Math.max(MIN_DROP, BASE_DROP - DROP_PER_LEVEL * level(s));
  let cur = s;
  let acc = s.dropAcc + dt;
  while (acc >= interval && cur.alive && cur.active) {
    acc -= interval;
    cur = stepDown(cur);
  }
  return { ...cur, dropAcc: acc };
}

export function input(s: TetrisState, key: string): TetrisState {
  if (!s.alive || !s.active) return s;
  const a = s.active;
  if (key === "ArrowLeft") {
    return collides(s.well, a, -1, 0) ? s : { ...s, active: { ...a, x: a.x - 1 } };
  }
  if (key === "ArrowRight") {
    return collides(s.well, a, 1, 0) ? s : { ...s, active: { ...a, x: a.x + 1 } };
  }
  if (key === "ArrowDown") return stepDown({ ...s, dropAcc: 0 });
  if (key === "ArrowUp" || key === "click") {
    const cells = rotate(a.cells);
    return collides(s.well, a, 0, 0, cells) ? s : { ...s, active: { ...a, cells } };
  }
  if (key === " ") {
    let cur = s;
    while (cur.active && !collides(cur.well, cur.active, 0, 1)) {
      cur = { ...cur, active: { ...cur.active, y: cur.active.y + 1 } };
    }
    return lockPiece({ ...cur, dropAcc: 0 });
  }
  return s;
}

export function initialState(_seed = 1): TetrisState {
  const first = draw(refill());
  const second = draw(first.bag);
  return {
    well: Array.from({ length: WELL_H }, () => Array<Piece | null>(WELL_W).fill(null)),
    active: spawn(first.kind),
    bag: second.bag,
    next: second.kind,
    dropAcc: 0,
    lines: 0,
    score: 0,
    alive: true,
  };
}

const pad = (s: string, n: number) => (s + " ".repeat(n)).slice(0, n);

/** WELL_H lines of right-margin HUD, each exactly HUD_W chars. */
export function hudLines(s: TetrisState): string[] {
  const preview = normalize(SHAPES[s.next]);
  const ph = Math.max(...preview.map((c) => c[1])) + 1;
  const lines = Array<string>(WELL_H).fill("");
  lines[0] = "  NEXT";
  for (let y = 0; y < ph; y++) {
    let row = "   ";
    for (let x = 0; x < 4; x++) {
      row += preview.some(([px, py]) => px === x && py === y) ? "██" : "  ";
    }
    lines[1 + y] = row;
  }
  lines[ph + 2] = `  LINES ${String(s.lines).padStart(3, " ")}`;
  lines[ph + 3] = `  LEVEL ${String(level(s)).padStart(3, " ")}`;
  return lines.map((l) => pad(l, HUD_W));
}

export function renderWell(s: TetrisState): string[] {
  const active = new Set<string>();
  if (s.active) {
    for (const [cx, cy] of s.active.cells) {
      active.add(`${s.active.x + cx},${s.active.y + cy}`);
    }
  }
  const hud = hudLines(s);
  const bar = "─".repeat(WELL_W * CELL);
  const out: string[] = [pad("┌" + bar + "┐", LANE_WIDTH)];
  for (let y = 0; y < WELL_H; y++) {
    let row = "│";
    for (let x = 0; x < WELL_W; x++) {
      row += active.has(`${x},${y}`) ? "▓▓" : s.well[y][x] ? "██" : "  ";
    }
    out.push(pad(row + "│" + hud[y], LANE_WIDTH));
  }
  out.push(pad("└" + bar + "┘", LANE_WIDTH));
  return out;
}

export const tetrisEngine: GameEngine<TetrisState> = {
  key: "tetris",
  label: "TETRIS",
  rows: TETRIS_ROWS,
  init: initialState,
  tick,
  input,
  render: renderWell,
  score: (s) => Math.min(MAX_SCORE, s.score),
  over: (s) => !s.alive,
  hint: (_s, playing) =>
    playing
      ? "← → MOVE · ↑ ROTATE · ↓ SOFT · SPACE DROP"
      : "SPACE to play · ← → move · ↑ rotate",
};
