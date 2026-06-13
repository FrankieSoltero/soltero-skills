import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RESERVED = ['anthropic', 'claude'];
const NAME_RE = /^[a-z0-9-]+$/;

export function validateFrontmatter(fm, folderName) {
  const errors = [];
  const name = fm.name;
  if (!name) {
    errors.push('missing required field: name');
  } else {
    if (name.length > 64) errors.push(`name exceeds 64 chars: ${name}`);
    if (!NAME_RE.test(name)) errors.push(`name must be lowercase letters/numbers/hyphens: ${name}`);
    if (RESERVED.includes(name)) errors.push(`name uses reserved word: ${name}`);
    if (folderName && name !== folderName) errors.push(`name "${name}" != folder "${folderName}"`);
  }
  const desc = fm.description;
  if (!desc) errors.push('missing required field: description');
  else if (desc.length > 1024) errors.push(`description exceeds 1024 chars (${desc.length})`);
  return errors;
}

export function parseFrontmatter(content) {
  const m = content.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return null;
  const fm = {};
  for (const line of m[1].split('\n')) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let val = line.slice(idx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    fm[key] = val;
  }
  return fm;
}

function main() {
  const skillsDir = 'skills';
  let failed = false;
  let dirs = [];
  try { dirs = readdirSync(skillsDir); }
  catch { console.error(`No ${skillsDir}/ directory found`); process.exit(1); }
  for (const d of dirs) {
    const skillPath = join(skillsDir, d);
    if (!statSync(skillPath).isDirectory()) continue;
    const skillMd = join(skillPath, 'SKILL.md');
    let content;
    try { content = readFileSync(skillMd, 'utf8'); }
    catch { console.error(`✗ ${d}: missing SKILL.md`); failed = true; continue; }
    const fm = parseFrontmatter(content);
    if (!fm) { console.error(`✗ ${d}: missing YAML frontmatter`); failed = true; continue; }
    const errors = validateFrontmatter(fm, d);
    if (errors.length) { for (const e of errors) console.error(`✗ ${d}: ${e}`); failed = true; }
    else console.log(`✓ ${d}`);
  }
  process.exit(failed ? 1 : 0);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
