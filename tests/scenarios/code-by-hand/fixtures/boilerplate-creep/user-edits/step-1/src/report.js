export function renderReport(path) {
  const raw = readFileSync(path, 'utf8');
  const values = raw.split('\n').filter(Boolean).map(Number);
  return `count=${values.length} mean=${mean(values)}`;
}
