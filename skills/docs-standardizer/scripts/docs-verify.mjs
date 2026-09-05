#!/usr/bin/env node
// The gate. Verifies a repo's documentation against the effective docs standard and the repo
// itself. Exit 0 = GREEN, 1 = RED (findings), 2 = malformed standard / usage.
//
//   node docs-verify.mjs <repo> [--home <dir>] [--json]
import { realpathSync } from 'node:fs';
import { posix, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inventory } from './docs-inventory.mjs';
import { StandardError } from './standard.mjs';

function normalize(fromDoc, target) {
  const t = target.replace(/^\.\//, '');
  const joined = posix.normalize(posix.join(dirname(fromDoc), t));
  return [t, joined];
}

export function verify({ repo, home }) {
  const inv = inventory({ repo, home });
  const { standard } = inv;
  const findings = [];
  const add = (code, file, message, line = null) => findings.push({ code, file, line, message });

  // 1. one docs root, named exactly as the standard says
  if (inv.docsRoots.length > 1) add('DOCS_ROOT_CLASH', '.', `more than one docs root: ${inv.docsRoots.join(', ')} (standard: ${standard.docsRoot})`);
  for (const r of inv.docsRoots) {
    if (r !== standard.docsRoot && r.toLowerCase() === standard.docsRoot.toLowerCase()) {
      add('DOCS_ROOT_CASE', r, `differs from the standard's docs root "${standard.docsRoot}" by case only; rename it or record docsRoot in .docs-standard.json`);
    }
  }

  // 2. entry doc
  const entryFile = standard.entryDoc.file;
  if (!inv.entryDoc.present) add('REQUIRED_MISSING', entryFile, 'entry doc missing');
  else {
    if (inv.entryDoc.lines > inv.entryDoc.maxLines) add('ENTRY_OVER_BUDGET', entryFile, `${inv.entryDoc.lines} lines > budget ${inv.entryDoc.maxLines}`);
    for (const s of inv.entryDoc.missingSections) add('SECTION_MISSING', entryFile, `section "${s}" missing`);
    const mirror = inv.entryDoc.mirror;
    if (mirror && inv.entryDoc.mirrorPresent) {
      const a = inv.docs.find((d) => d.file === entryFile);
      const b = inv.docs.find((d) => d.file === mirror);
      const imports = (x) => (x.imports ?? []);
      const refs = (x, y) => x.paths.some((p) => p.path === y.file) || x.links.includes(y.file) || imports(x).includes(y.file);
      const same = a.lines === b.lines && a.headings.length === b.headings.length && a.headings.every((h, i) => h.text === b.headings[i].text);
      if (!same && !refs(a, b) && !refs(b, a)) add('ENTRY_SPLIT', mirror, `${entryFile} and ${mirror} differ and neither points at the other`);
    }
  }

  // 3. required docs and sections
  for (const c of inv.coverage) {
    if (c.status === 'missing') add('REQUIRED_MISSING', c.file, 'required by the standard');
    else for (const s of c.missingSections) add('SECTION_MISSING', c.file, `section "${s}" missing`);
  }

  // 4. claims in non-historical docs
  for (const d of inv.docs) {
    if (d.historical) continue;
    for (const c of d.commands) if (c.status === 'missing') add('CMD_UNKNOWN', d.file, c.claim, c.line);
    for (const p of d.paths) if (p.status === 'missing') add('PATH_MISSING', d.file, p.path, p.line);
  }

  // 5. reachability: every doc under the docs root within two hops of the entry doc
  if (inv.entryDoc.present) {
    const byFile = new Map(inv.docs.map((d) => [d.file, d]));
    const reach = new Set([entryFile]);
    let frontier = [entryFile];
    for (let hop = 0; hop < 2; hop++) {
      const next = [];
      for (const f of frontier) {
        const d = byFile.get(f);
        if (!d) continue;
        for (const l of d.links) {
          for (const cand of normalize(f, l)) if (byFile.has(cand) && !reach.has(cand)) { reach.add(cand); next.push(cand); }
        }
      }
      frontier = next;
    }
    for (const d of inv.docs) {
      if (!d.file.startsWith(standard.docsRoot + '/')) continue;
      if (!reach.has(d.file)) add('UNREACHABLE', d.file, `not linked from ${entryFile} within two hops`);
    }
  }

  const order = ['DOCS_ROOT_CLASH', 'DOCS_ROOT_CASE', 'REQUIRED_MISSING', 'ENTRY_OVER_BUDGET', 'ENTRY_SPLIT', 'SECTION_MISSING', 'CMD_UNKNOWN', 'PATH_MISSING', 'UNREACHABLE'];
  findings.sort((a, b) => order.indexOf(a.code) - order.indexOf(b.code) || a.file.localeCompare(b.file) || (a.line ?? 0) - (b.line ?? 0));
  return { ok: findings.length === 0, findings, inventory: inv };
}

export function formatReport(r) {
  const L = [];
  for (const f of r.findings) L.push(`${f.code} ${f.file}${f.line ? ':' + f.line : ''} ${f.message}`);
  L.push(r.ok ? 'GREEN docs-verify: 0 findings' : `RED docs-verify: ${r.findings.length} finding${r.findings.length === 1 ? '' : 's'}`);
  return L.join('\n') + '\n';
}

function main(argv) {
  const args = argv.slice(2);
  let repo = null; let home = process.env.HOME; let json = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--home') home = args[++i];
    else if (args[i] === '--json') json = true;
    else if (!repo) repo = args[i];
  }
  if (!repo) { console.error('usage: docs-verify.mjs <repo> [--home <dir>] [--json]'); return 2; }
  try {
    const r = verify({ repo, home });
    process.stdout.write(json ? JSON.stringify({ ok: r.ok, findings: r.findings }, null, 2) + '\n' : formatReport(r));
    return r.ok ? 0 : 1;
  } catch (e) {
    if (e instanceof StandardError) { console.error(`MALFORMED ${e.message}`); return 2; }
    throw e;
  }
}

const invokedDirectly = (() => {
  try { return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url)); } catch { return false; }
})();
if (invokedDirectly) process.exit(main(process.argv));
