// Fixture copy of a target repo's own frontmatter gate (the gardener must reuse a
// repo's existing linter, not re-implement it — this file exists so tests can prove it).
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const NAME_RE = /^[a-z0-9-]+$/;

function parseFrontmatter(content) {
  const m = content.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return null;
  const fm = {};
  for (const line of m[1].split('\n')) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    fm[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
  return fm;
}

let failed = false;
for (const d of readdirSync('skills')) {
  const p = join('skills', d);
  if (!statSync(p).isDirectory()) continue;
  let content;
  try { content = readFileSync(join(p, 'SKILL.md'), 'utf8'); }
  catch { console.error(`x ${d}: missing SKILL.md`); failed = true; continue; }
  const fm = parseFrontmatter(content);
  if (!fm) { console.error(`x ${d}: missing YAML frontmatter`); failed = true; continue; }
  const errors = [];
  if (!fm.name) errors.push('missing required field: name');
  else {
    if (!NAME_RE.test(fm.name)) errors.push(`bad name: ${fm.name}`);
    if (fm.name !== d) errors.push(`name "${fm.name}" != folder "${d}"`);
  }
  if (!fm.description) errors.push('missing required field: description');
  if (errors.length) { for (const e of errors) console.error(`x ${d}: ${e}`); failed = true; }
  else console.log(`ok ${d}`);
}
process.exit(failed ? 1 : 0);
