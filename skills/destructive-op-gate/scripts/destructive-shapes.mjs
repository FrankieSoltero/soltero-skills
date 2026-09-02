// destructive-op-gate: recognise the command shapes whose blast radius is unbounded or
// unrecoverable. Used by the opt-in PreToolUse guard in ../hooks/pretooluse-guard.mjs and
// runnable on its own to check a command before you run it.
//
//   node destructive-shapes.mjs "psql -c 'delete from employees'"
//   echo "<command>" | node destructive-shapes.mjs -
//
// Exit 0 = nothing matched, 1 = at least one shape matched (printed one per line), 2 usage.
//
// This is a coarse net over shell text. It sees neither the resolved connection string nor
// the row count, so it cannot decide whether an operation is safe — it only says "this one
// needs the gate". False positives are expected and are cheaper than the alternative.
import { readFileSync } from 'node:fs';

/** Remove quoted-string bodies so an `echo "DROP TABLE ..."` does not read as a DROP. */
function stripQuoted(cmd) {
  return cmd.replace(/'[^']*'|"[^"]*"/g, (m) => ' '.repeat(m.length));
}

/** Split a shell line into rough statements so `-c 'a; b'` is examined clause by clause. */
function clauses(cmd) {
  return cmd.split(/;|&&|\|\||\n/g);
}

// A quoted argument counts as a SQL payload only when it *begins* with a statement
// keyword. That is what separates `psql -c 'DROP TABLE x'` from
// `echo "never run DROP TABLE x in prod" >> NOTES.md`.
const SQL_PAYLOAD = /^\s*(with|select|insert|update|delete|drop|truncate|alter|create)\b/i;

function sqlPayloads(clause) {
  const out = [];
  for (const m of clause.matchAll(/'([^']*)'|"([^"]*)"/g)) {
    const body = m[1] ?? m[2] ?? '';
    if (SQL_PAYLOAD.test(body)) out.push(body);
  }
  return out;
}

const SHAPES = [
  {
    id: 'sql-drop',
    test: (c) => /\bdrop\s+(table|database|schema|index|column|type|view)\b/i.test(c),
    why: 'DROP removes the object and its contents; there is no row-level undo',
  },
  {
    id: 'sql-truncate',
    test: (c) => /\btruncate\s+(table\s+)?\w/i.test(c),
    why: 'TRUNCATE empties the table in one statement and is usually not logged row by row',
  },
  {
    id: 'sql-delete-without-where',
    test: (c) => /\bdelete\s+from\s+[\w."]+/i.test(c) && !/\bwhere\b/i.test(c),
    why: 'DELETE with no WHERE clause removes every row in the table',
  },
  {
    id: 'sql-update-without-where',
    test: (c) => /\bupdate\s+[\w."]+\s+set\b/i.test(c) && !/\bwhere\b/i.test(c),
    why: 'UPDATE with no WHERE clause rewrites every row in the table',
  },
  {
    id: 'migration-reset',
    test: (c) => /\bprisma\s+migrate\s+reset\b/i.test(c)
      || /\bprisma\s+db\s+push\b[^\n]*--(force-reset|accept-data-loss)/i.test(c)
      || /\b(drizzle-kit\s+drop|sequelize\s+db:drop|rails\s+db:drop|django-admin\s+flush|dropdb)\b/i.test(c),
    why: 'this drops and recreates the schema, discarding every row in the target database',
  },
];

const RM_RF = /\brm\s+(?:-[a-zA-Z]*\s+)*-[a-zA-Z]*[rR][a-zA-Z]*f|(?:\brm\s+(?:-[a-zA-Z]*\s+)*-[a-zA-Z]*f[a-zA-Z]*[rR])/;

/**
 * `rm -rf` is only ignorable when every target is demonstrably a temp path. Detection runs
 * on the quote-stripped text (so a grep for "rm -rf /etc" is not a hit), but the targets
 * are read from the original clause (so `"$BUILD_DIR"` is still visibly unresolved).
 */
function checkRmRf(bare, raw) {
  if (!RM_RF.test(bare)) return null;
  const tokens = raw.trim().split(/\s+/);
  const rmAt = tokens.findIndex((t) => /^rm$/.test(t.replace(/^.*\//, '')));
  const targets = tokens.slice(rmAt + 1).filter((t) => t && !t.startsWith('-'));
  if (targets.length === 0) return { id: 'rm-rf', why: 'rm -rf with no visible target' };
  const unresolved = targets.filter((t) => /\$|`|\*|\?/.test(t));
  if (unresolved.length) {
    return {
      id: 'rm-rf-unresolved',
      why: `rm -rf whose target is not resolvable from the command text (${unresolved.join(' ')}) — an empty or unexpected expansion deletes something else`,
    };
  }
  const outside = targets.filter((t) => !/^(\/private)?\/tmp\//.test(t) && !/^(\/private)?\/var\/folders\//.test(t));
  if (outside.length) {
    return { id: 'rm-rf', why: `rm -rf targeting a path outside /tmp (${outside.join(' ')})` };
  }
  return null;
}

/** @returns {{id: string, why: string, clause: string}[]} */
export function matchDestructiveShapes(command) {
  const cmd = String(command ?? '');
  if (!cmd.trim()) return [];
  const out = [];
  const seen = new Set();
  const push = (m, clause) => {
    if (seen.has(m.id)) return;
    seen.add(m.id);
    out.push({ ...m, clause: clause.trim().slice(0, 200) });
  };
  for (const rawClause of clauses(cmd)) {
    const bare = stripQuoted(rawClause);
    // SQL usually arrives inside the quotes (psql -c '...'), so scan the unquoted text
    // plus any quoted argument that reads as a statement in its own right.
    const scannable = [bare, ...sqlPayloads(rawClause)];
    for (const shape of SHAPES) {
      if (scannable.some((t) => shape.test(t))) push({ id: shape.id, why: shape.why }, rawClause);
    }
    const rm = checkRmRf(bare, rawClause);
    if (rm) push(rm, rawClause);
  }
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const arg = process.argv[2];
  if (!arg) {
    process.stderr.write('usage: destructive-shapes.mjs "<command>" | destructive-shapes.mjs -\n');
    process.exit(2);
  }
  const command = arg === '-' ? readFileSync(0, 'utf8') : process.argv.slice(2).join(' ');
  const hits = matchDestructiveShapes(command);
  for (const h of hits) process.stdout.write(`${h.id}: ${h.why}\n`);
  process.exit(hits.length ? 1 : 0);
}
