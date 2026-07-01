import { test } from 'node:test'
import assert from 'node:assert/strict'
import { checkWorkflowSyntax } from './check-workflow-syntax.mjs'

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
