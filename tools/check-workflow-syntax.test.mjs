import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { checkWorkflowSyntax } from './check-workflow-syntax.mjs'

const REPO_ROOT = fileURLToPath(new URL('..', import.meta.url))
const here = dirname(fileURLToPath(import.meta.url))

test('the committed audit-swarm workflow script parses under the runtime dialect', () => {
  const src = readFileSync(`${REPO_ROOT}skills/audit-swarm/workflows/audit.mjs`, 'utf8')
  const r = checkWorkflowSyntax(src)
  assert.equal(r.ok, true, r.error)
})

test('accepts a workflow script with export meta, top-level await, and top-level return', () => {
  const src = [
    "export const meta = { name: 'x', description: 'y' }",
    'const items = [1, 2, 3]',
    'const results = await parallel(items.map(i => () => agent(`do ${i}`)))',
    'return { count: results.length }',
  ].join('\n')
  const r = checkWorkflowSyntax(src)
  assert.equal(r.ok, true, r.error)
})

test('rejects a genuine syntax error (unbalanced brace)', () => {
  const src = "export const meta = { name: 'x' }\nreturn { oops: "
  const r = checkWorkflowSyntax(src)
  assert.equal(r.ok, false)
  assert.match(r.error, /Unexpected|Unterminated|missing|token/i)
})

test('rejects a mismatched template literal', () => {
  const src = 'export const meta = {}\nconst s = `unterminated ${1}\nreturn s'
  const r = checkWorkflowSyntax(src)
  assert.equal(r.ok, false)
})

test('CLI still runs when invoked through a symlinked path (macOS /tmp → /private/tmp)', () => {
  const linkDir = mkdtempSync(join(tmpdir(), 'cws-link-'))
  const link = join(linkDir, 'tools-link')
  symlinkSync(here, link)
  const script = join(link, 'check-workflow-syntax.mjs')
  const bad = join(linkDir, 'bad.mjs')
  writeFileSync(bad, "export const meta = { name: 'x' }\nreturn { oops: ")
  const r = spawnSync(process.execPath, [script, bad], { encoding: 'utf8' })
  assert.match(r.stderr, /SYNTAX ERROR in/, 'main() must run when the checker is reached through a symlink')
  assert.equal(r.status, 1, 'a broken workflow script must exit 1, never a silent 0, through a symlinked path')
  const good = join(linkDir, 'good.mjs')
  writeFileSync(good, "export const meta = { name: 'x', description: 'y' }\nreturn { ok: true }")
  const ok = spawnSync(process.execPath, [script, good], { encoding: 'utf8' })
  assert.match(ok.stdout, /parses under the Workflow runtime dialect/)
  assert.equal(ok.status, 0)
})

test('CLI checks every path given and exits 1 if any one fails', () => {
  const dir = mkdtempSync(join(tmpdir(), 'cws-multi-'))
  const script = join(here, 'check-workflow-syntax.mjs')
  const good = join(dir, 'good.mjs')
  const bad = join(dir, 'bad.mjs')
  writeFileSync(good, "export const meta = { name: 'x', description: 'y' }\nreturn { ok: true }")
  writeFileSync(bad, "export const meta = { name: 'x' }\nreturn { oops: ")
  const mixed = spawnSync(process.execPath, [script, bad, good], { encoding: 'utf8' })
  assert.match(mixed.stderr, new RegExp(`SYNTAX ERROR in ${bad}`))
  assert.match(mixed.stdout, new RegExp(`ok: ${good}`), 'a failure must not stop the remaining paths being checked')
  assert.equal(mixed.status, 1)
  const allGood = spawnSync(process.execPath, [script, good, good], { encoding: 'utf8' })
  assert.equal(allGood.stdout.match(/^ok: /gm)?.length, 2)
  assert.equal(allGood.status, 0)
})
