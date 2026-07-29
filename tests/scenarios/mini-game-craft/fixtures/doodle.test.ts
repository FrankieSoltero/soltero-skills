import { describe, it, expect } from "vitest";
import { LANE_WIDTH } from "./engine";
import {
  doodleEngine, initialState, tick, input,
  DOODLE_ROWS, PLAT_W, type DoodleState,
} from "./doodle";

/** A fully-specified state, so no test depends on a random platform draw. */
const st = (over: Partial<DoodleState> = {}): DoodleState => ({
  x: 10, y: 5, vy: 0, dir: 0, cam: 0,
  platforms: [{ x: 8, y: 3 }],
  best: 5, alive: true,
  ...over,
});

const shape = (s: DoodleState) => {
  const rows = doodleEngine.render(s);
  expect(rows).toHaveLength(DOODLE_ROWS);
  for (const r of rows) expect(r).toHaveLength(LANE_WIDTH);
};

describe("doodle jump", () => {
  it("renders exactly `rows` rows of LANE_WIDTH chars — fresh, mid-run, and dead", () => {
    shape(initialState());
    shape(st({ y: 140, cam: 128, best: 140 }));
    shape(st({ alive: false, y: -3 }));
  });

  it("falls under gravity", () => {
    let s = st({ platforms: [] });
    for (let i = 0; i < 10; i++) s = tick(s, 0.05);
    expect(s.y).toBeLessThan(5);
    expect(s.vy).toBeLessThan(0);
  });

  it("bounces when descending onto a platform", () => {
    // above platform {x:8,y:3}, falling fast enough to cross it in one step
    let s = st({ y: 3.4, vy: -12, x: 9 });
    s = tick(s, 0.05);
    expect(s.vy).toBeGreaterThan(0);
  });

  it("passes through a platform while rising", () => {
    let s = st({ y: 2.6, vy: 12, x: 9 }); // below the platform, going up
    s = tick(s, 0.05);
    expect(s.vy).toBeLessThan(12); // gravity only — no bounce impulse
    expect(s.vy).toBeGreaterThan(0);
  });

  it("does not bounce when horizontally clear of the platform", () => {
    let s = st({ y: 3.4, vy: -12, x: 30 }); // platform spans x 8..12
    s = tick(s, 0.05);
    expect(s.vy).toBeLessThan(0);
  });

  it("steers left and right and wraps at both edges", () => {
    expect(input(st(), "ArrowLeft").dir).toBe(-1);
    expect(input(st(), "ArrowRight").dir).toBe(1);
    expect(input(st({ dir: 1 }), "ArrowDown").dir).toBe(0);
    const left = tick(st({ x: 0.2, dir: -1, platforms: [] }), 0.05);
    expect(left.x).toBeGreaterThan(LANE_WIDTH - 2); // wrapped
    const right = tick(st({ x: LANE_WIDTH - 0.2, dir: 1, platforms: [] }), 0.05);
    expect(right.x).toBeLessThan(2); // wrapped
  });

  it("ignores unknown keys and leaves a dead state inert", () => {
    const s = st();
    expect(input(s, "q")).toBe(s);
    const dead = st({ alive: false });
    expect(tick(dead, 0.05)).toBe(dead);
  });

  it("scores the high-water altitude and never decreases it", () => {
    let s = st({ y: 40, best: 40, cam: 28, vy: -5, platforms: [] });
    const before = doodleEngine.score(s);
    for (let i = 0; i < 10; i++) s = tick(s, 0.05);
    expect(s.y).toBeLessThan(40);
    expect(doodleEngine.score(s)).toBe(before); // falling never lowers the score
  });

  it("ends the run once the player drops below the view", () => {
    let s = st({ y: 1, vy: -20, cam: 0, platforms: [] });
    for (let i = 0; i < 20; i++) s = tick(s, 0.05);
    expect(s.alive).toBe(false);
    expect(doodleEngine.over(s)).toBe(true);
  });

  it("scrolls the camera up and keeps generating reachable platforms", () => {
    let s = initialState();
    for (let i = 0; i < 400; i++) s = tick(s, 0.05);
    expect(s.platforms.length).toBeGreaterThan(3);
    expect(s.platforms.every((p) => p.x >= 0 && p.x + PLAT_W <= LANE_WIDTH)).toBe(true);
  });
});
