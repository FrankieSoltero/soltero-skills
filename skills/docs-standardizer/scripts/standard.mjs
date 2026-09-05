// Effective documentation standard: bundled default <- user-scope file <- project override.
// Plain Node, no dependencies.
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
export const DEFAULT_STANDARD_PATH = join(here, '..', 'references', 'default-standard.json');
export const DEFAULT_STANDARD = JSON.parse(readFileSync(DEFAULT_STANDARD_PATH, 'utf8'));

/** Keys a repo-local .docs-standard.json may set. Everything else is user scope only. */
export const PROJECT_OVERRIDABLE = ['docsRoot', 'exclude', 'entryDoc.file', 'required'];

export class StandardError extends Error {}

export function userStandardPath(home) {
  return join(home, '.claude', 'docs-standard.json');
}

function readJson(path, label) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (e) {
    throw new StandardError(`${label} at ${path} is not valid JSON: ${e.message}`);
  }
}

/** Rewrite every required-doc path under the old docs root to the new one. */
function rerootRequired(required, fromRoot, toRoot) {
  return required.map((r) => {
    if (r.file.startsWith(fromRoot + '/')) return { ...r, file: toRoot + r.file.slice(fromRoot.length) };
    return r;
  });
}

function mergeUser(base, user) {
  const out = structuredClone(base);
  for (const [k, v] of Object.entries(user)) {
    if (k === 'entryDoc' && v && typeof v === 'object') out.entryDoc = { ...out.entryDoc, ...v };
    else out[k] = v;
  }
  if (!user.required && user.docsRoot && user.docsRoot !== base.docsRoot) {
    out.required = rerootRequired(base.required, base.docsRoot, user.docsRoot);
  }
  return out;
}

function mergeProject(base, project, warnings) {
  const out = structuredClone(base);
  for (const [k, v] of Object.entries(project)) {
    if (k === 'docsRoot') {
      if (v !== base.docsRoot) out.required = rerootRequired(out.required, base.docsRoot, v);
      out.docsRoot = v;
    } else if (k === 'exclude') {
      out.exclude = [...new Set([...(base.exclude ?? []), ...(Array.isArray(v) ? v : [])])];
    } else if (k === 'entryDoc') {
      for (const [ek, ev] of Object.entries(v ?? {})) {
        if (ek === 'file') out.entryDoc.file = ev;
        else warnings.push(`project override ignored: entryDoc.${ek} is user scope only`);
      }
    } else if (k === 'required') {
      const have = new Set(out.required.map((r) => r.file));
      for (const r of Array.isArray(v) ? v : []) if (r && r.file && !have.has(r.file)) out.required.push(r);
    } else {
      warnings.push(`project override ignored: ${k} is user scope only`);
    }
  }
  return out;
}

/**
 * @returns {{ standard: object, source: { default: string, user: string|null, project: string|null }, warnings: string[] }}
 */
export function loadStandard({ home, repo }) {
  const warnings = [];
  const source = { default: DEFAULT_STANDARD_PATH, user: null, project: null };
  let standard = structuredClone(DEFAULT_STANDARD);
  const userPath = home ? userStandardPath(home) : null;
  if (userPath && existsSync(userPath)) {
    standard = mergeUser(standard, readJson(userPath, 'user docs-standard.json'));
    source.user = userPath;
  }
  const projectPath = repo ? join(repo, '.docs-standard.json') : null;
  if (projectPath && existsSync(projectPath)) {
    standard = mergeProject(standard, readJson(projectPath, 'project .docs-standard.json'), warnings);
    source.project = projectPath;
  }
  return { standard, source, warnings };
}

/** Minimal glob: `**` spans directories, `*` stays within one segment; bare names match the basename. */
export function matchesPattern(relPath, pattern) {
  const p = relPath.replace(/\\/g, '/');
  if (!pattern.includes('/') && !pattern.includes('*')) return p === pattern || p.endsWith('/' + pattern);
  const re = '^' + pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*\//g, '(?:.*/)?')
    .replace(/\*\*/g, '.*')
    .replace(/\*/g, '[^/]*') + '$';
  return new RegExp(re).test(p);
}
