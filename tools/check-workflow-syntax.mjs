#!/usr/bin/env node
// Syntax-check a Workflow-tool script under the runtime dialect it actually runs in.
//
// Workflow scripts are a hybrid: they open with `export const meta = {...}` (ES module)
// AND use top-level `await` and a top-level `return` (only legal inside a function). The
// runtime wraps the script body in an async function before evaluating, so plain
// `node --check` rejects the top-level return with "Illegal return statement" even when
// the script is perfectly valid. This reproduces the runtime's wrapping for a syntax-only
// gate: strip the leading `export ` keyword(s), wrap the body in an async IIFE, and compile
// (never run) it with vm.
import vm from 'node:vm'
import { readFileSync } from 'node:fs'

export function checkWorkflowSyntax(source) {
  const wrapped = '(async () => {\n' + source.replace(/^export /gm, '') + '\n})()'
  try {
    new vm.Script(wrapped, { filename: 'workflow-wrapped.js' })
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err.message }
  }
}

const invokedDirectly = import.meta.url === `file://${process.argv[1]}`
if (invokedDirectly) {
  const path = process.argv[2]
  if (!path) {
    console.error('usage: check-workflow-syntax.mjs <workflow.mjs>')
    process.exit(2)
  }
  const result = checkWorkflowSyntax(readFileSync(path, 'utf8'))
  if (result.ok) {
    console.log(`ok: ${path} parses under the Workflow runtime dialect`)
  } else {
    console.error(`SYNTAX ERROR in ${path}: ${result.error}`)
    process.exit(1)
  }
}
