export function now() {
  return new Date();
}

export function fromParts(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}
