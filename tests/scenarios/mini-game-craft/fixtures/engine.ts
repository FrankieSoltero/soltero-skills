/** v5b: every playable game is one pure module exporting a GameEngine.
 *  The ThinkingStrip host is generic — it never branches per game. */
export const LANE_WIDTH = 40;

export const lcg = (r: number): number => (r * 1664525 + 1013904223) >>> 0;

export interface GameEngine<S = unknown> {
  key: string;
  label: string;
  /** lane height in text rows */
  rows: number;
  /** true when the engine consumes printable keys — the host must not
   *  steal letters (e.g. G-to-swap) while a run is live */
  capturesText?: boolean;
  init(seed: number): S;
  tick(s: S, dt: number): S;
  /** keyboard ("ArrowUp", "w", " ", …) or synthetic "click"; unknown keys are a no-op */
  input(s: S, key: string): S;
  /** exactly `rows` strings, each LANE_WIDTH chars */
  render(s: S): string[];
  score(s: S): number;
  /** run finished — death or completion */
  over(s: S): boolean;
  hint(s: S, playing: boolean): string;
}

/** One submission decision per finished run: save a new personal best and
 *  submit to the party only when it beats the previous local best. */
export interface RunLedger {
  submitted: boolean;
  localBest: number;
}

export function settleRun(
  ledger: RunLedger,
  over: boolean,
  score: number,
): { ledger: RunLedger; submit: boolean } {
  if (!over || ledger.submitted) return { ledger, submit: false };
  if (score > ledger.localBest) {
    return { ledger: { submitted: true, localBest: score }, submit: true };
  }
  return { ledger: { ...ledger, submitted: true }, submit: false };
}
