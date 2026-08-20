// Shared SKILL.md frontmatter parser + validator.
// Used by BOTH the CLI gate (tools/lint-frontmatter.mjs — runs with no deps/build)
// and the MCP server's lint_skill tool (mcp/src/frontmatter.ts re-exports this).
// Keep this file dependency-free plain JS: it must run before `npm ci`.

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
