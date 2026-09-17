#!/usr/bin/env node
// instagram-studio: check the dependencies the skill needs before it starts rendering.
// REPORTS ONLY — it never installs anything and spawns no child process: the PATH lookup
// scans the directories in process.env.PATH with the filesystem, it does not run `which`.
//
// Usage:
//   node preflight.mjs [--json]
//
// Exit codes: 0 every check passed, 1 at least one check failed, 2 usage error.
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { delimiter, join } from 'node:path';

const MIN_NODE_MAJOR = 22;

/** The hyperframes skills the renderer drives, in the order the skill uses them. */
const REQUIRED_SKILLS = [
  'hyperframes-core',
  'hyperframes-animation',
  'hyperframes-creative',
  'hyperframes-keyframes',
  'hyperframes-cli',
];

/** Skill roots searched in order; a skill counts as installed in any one of them. */
const skillRoots = (homeDir, cwd) => [
  join(homeDir, '.claude', 'skills'),
  join(cwd, '.claude', 'skills'),
  join(homeDir, '.agents', 'skills'),
  join(cwd, '.agents', 'skills'),
];

const FIX_NODE = 'Install Node.js 22 or newer';
const FIX_FFMPEG = 'brew install ffmpeg';
const FIX_SKILLS = 'npx hyperframes skills update';

const check = (name, ok, detail, fix) => ({ name, ok, detail, fix: ok ? null : fix });

/**
 * Pure: every piece of I/O is injected, so the checks are testable without a real machine.
 *   nodeVersion — `process.version`, e.g. "v26.5.1"
 *   which(bin)  — absolute path to the binary, or null when it is not on PATH
 *   exists(path)— whether a path exists on disk
 * Returns { ok, checks: [{ name, ok, detail, fix }] } with the checks in a fixed order.
 */
export function runPreflight({ nodeVersion, which, exists, homeDir, cwd }) {
  const major = Number(/^v?(\d+)/.exec(String(nodeVersion))?.[1]);
  const checks = [
    check(
      'node',
      Number.isInteger(major) && major >= MIN_NODE_MAJOR,
      `${nodeVersion} (need v${MIN_NODE_MAJOR} or newer)`,
      FIX_NODE,
    ),
  ];

  for (const bin of ['ffmpeg', 'ffprobe']) {
    const found = which(bin);
    checks.push(check(bin, Boolean(found), found || 'not found on PATH', FIX_FFMPEG));
  }

  const roots = skillRoots(homeDir, cwd);
  const missing = REQUIRED_SKILLS.filter(
    (skill) => !roots.some((root) => exists(join(root, skill, 'SKILL.md'))),
  );
  checks.push(check(
    'hyperframes-skills',
    missing.length === 0,
    missing.length === 0
      ? `all ${REQUIRED_SKILLS.length} skills installed`
      : `missing: ${missing.join(', ')}`,
    FIX_SKILLS,
  ));

  return { ok: checks.every((c) => c.ok), checks };
}

/** PATH lookup without a subprocess: the first PATH entry that holds the binary wins. */
function lookUpOnPath(bin, pathValue = process.env.PATH || '') {
  for (const dir of pathValue.split(delimiter)) {
    if (!dir) continue;
    const candidate = join(dir, bin);
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

export function main(argv) {
  let json = false;
  for (const arg of argv) {
    if (arg === '--json') json = true;
    else {
      process.stderr.write(`unknown option: ${arg}\nusage: preflight.mjs [--json]\n`);
      return 2;
    }
  }

  const result = runPreflight({
    nodeVersion: process.version,
    which: (bin) => lookUpOnPath(bin),
    exists: existsSync,
    homeDir: homedir(),
    cwd: process.cwd(),
  });

  if (json) {
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  } else {
    process.stdout.write(`PREFLIGHT: ${result.ok ? 'ok' : 'blocked'}\n`);
    for (const c of result.checks) {
      process.stdout.write(`  ${c.ok ? 'ok  ' : 'FAIL'}  ${c.name.padEnd(18)} ${c.detail}\n`);
      if (c.fix) process.stdout.write(`        fix${''.padEnd(16)} ${c.fix}\n`);
    }
  }
  return result.ok ? 0 : 1;
}

if (import.meta.url === `file://${process.argv[1]}`) process.exit(main(process.argv.slice(2)));
