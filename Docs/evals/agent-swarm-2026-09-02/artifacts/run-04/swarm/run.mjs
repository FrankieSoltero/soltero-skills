export const meta = {
  name: 'legacyfetch-to-httpclient',
  description: 'Migrate every legacyFetch(...) caller under src/ to httpClient and verify nothing broke',
  phases: [
    { title: 'Migrate', detail: '4 agents, one per src/ subdirectory (account/cart/catalog/checkout), 10 files each, haiku' },
    { title: 'Verify', detail: '1 agent: grep sweep + node --check + existing test suite + runtime smoke check, sonnet' },
    { title: 'Repair', detail: 'only runs if Verify fails; exactly 1 fix-up round, sonnet, then re-verify — no retry loop' },
  ],
}

// Discovery already done inline in the calling session (not re-spent here as an agent call):
//   grep -rl "legacyFetch(" src            -> 41 hits: the 40 callers below + lib/legacyFetch.js itself
//   md5 of each of the 40 caller files     -> all distinct (different dir/id), all 5 lines long
//   grep -Ev 'legacyFetch(\'/api/DIR/\' + id)' over all 40 -> zero deviations
// Conclusion: all 40 callers are one identical 5-line template, one per src/ subdirectory, 10 each.
// That uniformity is what lets this script skip a scout phase and go straight to 4 writers.

const DIRS = ['account', 'cart', 'catalog', 'checkout']
const MAX_AGENTS = 7 // 4 writers + 1 verify + at most (1 repair + 1 re-verify); hard ceiling, no loop can exceed it

const VERIFY_SCHEMA = {
  type: 'object',
  properties: {
    overallPass: { type: 'boolean' },
    grepStragglers: { type: 'array', items: { type: 'string' } },
    syntaxErrors: { type: 'array', items: { type: 'string' } },
    testSuitePassed: { type: 'boolean' },
    testSuiteOutput: { type: 'string' },
    smokeCheckResults: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          file: { type: 'string' },
          ok: { type: 'boolean' },
          detail: { type: 'string' },
        },
        required: ['file', 'ok', 'detail'],
      },
    },
  },
  required: [
    'overallPass',
    'grepStragglers',
    'syntaxErrors',
    'testSuitePassed',
    'testSuiteOutput',
    'smokeCheckResults',
  ],
}

const TRANSFORM_SPEC = (dir) => `
Every file in src/${dir}/ matches this exact 5-line shape (verified across all 40 callers before this
run started — zero deviations):

  import { legacyFetch } from '../lib/legacyFetch.js';
  export async function loadNAME(id) {
    const r = await legacyFetch('/api/${dir}/' + id);
    return r.json();
  }

Rewrite each one to:

  import { httpClient } from '../lib/httpClient.js';
  export async function loadNAME(id) {
    return httpClient.get('/api/${dir}/' + id);
  }

This is behavior-preserving, not a redesign: legacyFetch's r.json() resolves to
{ url: '/api/${dir}/'+id, method: 'GET' }, and httpClient.get resolves to that exact shape directly —
dropping the .json() indirection changes nothing a caller observes.

Rules:
- Only touch files in src/${dir}/. Do not touch src/lib/legacyFetch.js — it stays in place, deprecated
  but not deleted (deleting it is out of scope for this migration).
- If a file does NOT match the shape above exactly (extra logic, opts/POST usage, more than one
  legacyFetch call, already migrated, anything unexpected), leave that one file untouched and report
  it instead of guessing at a rewrite.
- Read then Edit each file individually. There are 10 files in src/${dir}/.
`

phase('Migrate')
const writerResults = await parallel(
  DIRS.map((dir) => () =>
    agent(
      `Migrate every legacyFetch(...) caller in src/${dir}/ (this Node ESM storefront repo) to use
       httpClient from '../lib/httpClient.js' instead of legacyFetch from '../lib/legacyFetch.js'.

       ${TRANSFORM_SPEC(dir)}

       When done, return a JSON report: which files you migrated, and which (if any) you skipped and
       why.`,
      {
        phase: 'Migrate',
        label: `migrate:${dir}`,
        model: 'haiku',
        effort: 'low',
        schema: {
          type: 'object',
          properties: {
            dir: { type: 'string' },
            migrated: { type: 'array', items: { type: 'string' } },
            skipped: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  file: { type: 'string' },
                  reason: { type: 'string' },
                },
                required: ['file', 'reason'],
              },
            },
          },
          required: ['dir', 'migrated', 'skipped'],
        },
      }
    )
  )
)

const results = writerResults.filter(Boolean)
const migratedCount = results.reduce((n, r) => n + r.migrated.length, 0)
const skipped = results.flatMap((r) => r.skipped.map((s) => ({ dir: r.dir, ...s })))
log(`Migrated ${migratedCount}/40 files across ${results.length}/4 directories.`)
if (skipped.length) log(`Skipped (left untouched, needs a human look): ${JSON.stringify(skipped)}`)
if (results.length < DIRS.length) {
  log(`WARNING: ${DIRS.length - results.length} writer agent(s) failed outright (null result) — their directory was not touched.`)
}

phase('Verify')
const verifyPrompt = `
Verify the legacyFetch -> httpClient migration in this repo (/tmp/ab-agent-swarm/ws-04)
is safe to ship. Run these 4 checks, in order, and report the result of each:

1. grep -rn "legacyFetch(" src --include="*.js" | grep -v src/lib/legacyFetch.js
   Must return ZERO matches. List any stragglers verbatim (file:line).

2. node --check on every src/**/*.js file. All must be syntactically valid. List any that fail.

3. node --test test/  (the existing suite). Must still pass. Include the raw output.

4. Runtime smoke check: pick at least 5 migrated files spanning at least 3 different src/ subdirectories,
   dynamically import each module, call its exported loadX(id) function with id=7, and confirm the
   resolved value is exactly { url: '/api/<dir>/7', method: 'GET' } — the same shape legacyFetch's
   r.json() used to produce. Report per-file pass/fail with the actual resolved value.

Return overallPass=true only if all 4 checks are clean.
`
let finalVerdict = await agent(verifyPrompt, {
  phase: 'Verify',
  label: 'verify',
  model: 'sonnet',
  schema: VERIFY_SCHEMA,
})

if (finalVerdict && !finalVerdict.overallPass) {
  phase('Repair')
  log('Verification failed on the first pass — dispatching exactly one repair agent (no retry loop).')
  await agent(
    `The legacyFetch -> httpClient migration has verification failures. Verifier report:
     ${JSON.stringify(finalVerdict)}

     Fix exactly what's broken (syntax errors, missed/stray legacyFetch callers, behavior mismatches)
     using the Edit tool. Do not touch files the report already marked clean. This is the only repair
     round — be careful and check your own work before returning.`,
    { phase: 'Repair', label: 'repair', model: 'sonnet' }
  )
  finalVerdict = await agent(verifyPrompt, {
    phase: 'Verify',
    label: 're-verify',
    model: 'sonnet',
    schema: VERIFY_SCHEMA,
  })
  if (finalVerdict && !finalVerdict.overallPass) {
    log('Verification still failing after the one allowed repair round. Stopping here — this needs a human, not another agent.')
  }
} else if (!finalVerdict) {
  log('Verify agent returned null (dead/errored after retries). Treating as UNVERIFIED, not pass. Stopping — needs a human look, not another automatic round.')
}

log(`Agent budget used: <= ${MAX_AGENTS} (4 writers + verify, plus repair + re-verify only on failure).`)

return { migratedCount, skipped, finalVerdict }
