import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFrontmatter, validateFrontmatter } from './frontmatter.mjs';

// Re-exported so existing consumers (and tests) keep working against this path;
// the implementation now lives in ./frontmatter.mjs, shared with the MCP server.
export { parseFrontmatter, validateFrontmatter };

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
