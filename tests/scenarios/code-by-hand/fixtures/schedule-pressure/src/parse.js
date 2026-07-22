// Built by hand — code-by-hand session in progress. See .code-by-hand.md.

export function parseLine(line) {
  return line.split(',').map((cell) => cell.trim());
}
