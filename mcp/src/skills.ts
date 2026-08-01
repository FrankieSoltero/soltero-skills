// Skills discovery: walk skills/, parse SKILL.md frontmatter, read bodies and
// bundled files. Parse failures never fail the whole call — the offending
// skill is omitted and surfaced in `warnings`.
import {
  readdirSync,
  readFileSync,
  statSync,
  mkdirSync,
  writeFileSync,
  existsSync,
} from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { parseFrontmatter } from "./frontmatter.js";

export interface SkillSummary {
  name: string;
  description: string;
  /** Path to SKILL.md, relative to the skills dir's parent (e.g. skills/lean-tdd/SKILL.md). */
  path: string;
}

export interface Skill extends SkillSummary {
  /** Full SKILL.md content, frontmatter included. */
  body: string;
  /** Absolute path to the skill's directory. */
  dir: string;
}

export interface SkillsIndex {
  skills: Skill[];
  warnings: string[];
}

/** <repo-root>/skills, resolved from this module's own location (mcp/dist/). */
export function defaultSkillsDir(): string {
  return resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "skills");
}

/** Skills dir: SOLTERO_SKILLS_DIR env override wins, else next to the server. */
export function resolveSkillsDir(env: NodeJS.ProcessEnv = process.env): string {
  const override = env.SOLTERO_SKILLS_DIR;
  return override ? resolve(override) : defaultSkillsDir();
}

/** Fail-fast startup check: the skills dir must exist and be a readable directory. */
export function assertSkillsDir(skillsDir: string): void {
  let stat;
  try {
    stat = statSync(skillsDir);
  } catch {
    throw new Error(
      `Skills directory not found: ${skillsDir}\n` +
        `Set SOLTERO_SKILLS_DIR to a directory containing <name>/SKILL.md entries.`,
    );
  }
  if (!stat.isDirectory()) {
    throw new Error(`Skills path is not a directory: ${skillsDir}`);
  }
  try {
    readdirSync(skillsDir);
  } catch {
    throw new Error(`Skills directory is not readable: ${skillsDir}`);
  }
}

export function loadSkills(skillsDir: string): SkillsIndex {
  const warnings: string[] = [];
  const skills: Skill[] = [];
  let entries: string[];
  try {
    entries = readdirSync(skillsDir);
  } catch {
    return { skills, warnings: [`skills directory unreadable: ${skillsDir}`] };
  }
  for (const entry of entries.sort()) {
    const dir = join(skillsDir, entry);
    try {
      if (!statSync(dir).isDirectory()) continue;
    } catch {
      continue;
    }
    const skillMd = join(dir, "SKILL.md");
    let body: string;
    try {
      body = readFileSync(skillMd, "utf8");
    } catch {
      warnings.push(`${entry}: missing SKILL.md — omitted from listings`);
      continue;
    }
    const fm = parseFrontmatter(body);
    if (!fm || !fm.name || !fm.description) {
      warnings.push(
        `${entry}: unparseable or incomplete frontmatter — omitted from listings`,
      );
      continue;
    }
    skills.push({
      name: fm.name,
      description: fm.description,
      path: relative(dirname(skillsDir), skillMd),
      body,
      dir,
    });
  }
  return { skills, warnings };
}

/** Skills whose name is a prefix/substring match for `name` — for typo hints. */
export function closeMatches(index: SkillsIndex, name: string): string[] {
  const q = name.toLowerCase();
  return index.skills
    .filter(
      (s) =>
        s.name.toLowerCase().startsWith(q) ||
        s.name.toLowerCase().includes(q) ||
        (q.length > 3 && q.includes(s.name.toLowerCase())),
    )
    .map((s) => s.name)
    .slice(0, 5);
}

export function findSkill(
  index: SkillsIndex,
  name: string,
): Skill | undefined {
  return index.skills.find((s) => s.name === name);
}

/** Bundled files (everything except SKILL.md), as POSIX relative paths, sorted. */
export function listBundledFiles(skillDir: string): string[] {
  const out: string[] = [];
  const walk = (dir: string, prefix: string): void => {
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const rel = prefix ? `${prefix}/${e.name}` : e.name;
      if (e.isDirectory()) walk(join(dir, e.name), rel);
      else if (e.isFile() && rel !== "SKILL.md") out.push(rel);
    }
  };
  walk(skillDir, "");
  return out.sort();
}

/**
 * Read one bundled file by relative path. Returns null when the file is
 * missing, unreadable, or the path escapes the skill directory (traversal).
 */
export function readSkillFile(skillDir: string, relPath: string): string | null {
  const abs = resolve(skillDir, relPath);
  if (abs !== skillDir && !abs.startsWith(skillDir + sep)) return null;
  try {
    if (!statSync(abs).isFile()) return null;
    return readFileSync(abs, "utf8");
  } catch {
    return null;
  }
}

/** Create skills/<name>/SKILL.md. Throws if the skill directory already exists. */
export function writeSkillSkeleton(
  skillsDir: string,
  name: string,
  content: string,
): string {
  const dir = join(skillsDir, name);
  if (existsSync(dir)) {
    throw new Error(`skill directory already exists: ${name}`);
  }
  mkdirSync(dir, { recursive: true });
  const file = join(dir, "SKILL.md");
  writeFileSync(file, content);
  return file;
}
