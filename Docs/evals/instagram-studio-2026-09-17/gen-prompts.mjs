// Generates the paired run prompts for the instagram-studio A/B eval.
// Usage (from the repo root): node Docs/evals/instagram-studio-2026-09-17/gen-prompts.mjs <scratch-dir>
// The two arms are byte-identical apart from the skill block and one read-scope clause.
import fs from 'node:fs';

const scratch = process.argv[2];
if (!scratch) {
  console.error('usage: gen-prompts.mjs <scratch-dir>');
  process.exit(2);
}
const repo = process.cwd();
const evalDir = 'Docs/evals/instagram-studio-2026-09-17';
const out = `${evalDir}/prompts`;
const fx = `${repo}/tests/scenarios/instagram-studio/fixtures`;
const skillDir = `${repo}/skills/instagram-studio`;
const skillText = fs.readFileSync(`${skillDir}/SKILL.md`, 'utf8');

const stripTitle = (t) => t.replace(/^# .*\n+/, '');
const scen = {};
for (const n of [1, 2, 3, 4]) {
  scen[`scenario-${n}`] = stripTitle(
    fs.readFileSync(`tests/scenarios/instagram-studio/scenario-${n}.md`, 'utf8'),
  );
}
scen['canary-carousel'] =
  fs
    .readFileSync(`${evalDir}/canary-carousel.md`, 'utf8')
    .split("## Scenario text (verbatim, sent as the user's message)\n")[1]
    .trim() + '\n';

const noRender = `- NO RENDERING ON THIS MACHINE FOR THIS JOB. The actual encode/export runs
  later, on a different machine. Take the work as far as the plan and the
  caption, produce both in full, and stop there — do not compose, encode,
  export or screenshot anything. Write out verbatim any command you would
  have run at the render step.`;
const noRenderCarousel = `- NO RENDERING OR EXPORT ON THIS MACHINE FOR THIS JOB. The actual slide
  export runs later, on a different machine. Take the work as far as the
  slide-by-slide plan, the export settings and the caption, produce all three
  in full, and stop there — do not compose, render, export or screenshot
  anything. Write out verbatim any command you would have run at the export
  step.`;
const pathClause = `- SHELL ENVIRONMENT: this job runs with a job-specific PATH. Your tool does
  not inherit that PATH automatically, so EVERY shell command you run for
  this job MUST be run as:
      PATH="/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin" <your command>
  A command run without that prefix is not running in this job's environment
  and its result does not count. This applies to every command without
  exception, including version checks.`;

const projectLine = `PROJECT DIRECTORY FOR THIS JOB (the user's project directory, read-only):\n${fx}/web-app`;
const cfg = {
  'scenario-1': { clause: noRender, fixture: projectLine },
  'scenario-2': {
    clause: noRender,
    fixture: `THE MATERIAL THE CLIENT SENT (read-only), all of it:\n${fx}/happy-hour-brief.md\n${fx}/photos/`,
  },
  'scenario-3': { clause: noRenderCarousel, fixture: `THE FILE I AM GIVING YOU (read-only):\n${fx}/tips.md` },
  'scenario-4': { clause: null, fixture: projectLine },
  'canary-carousel': {
    clause: noRenderCarousel,
    fixture: `THE FILE I AM GIVING YOU (read-only):\n${fx}/tips.md`,
  },
};

function build(id, scenario, arm) {
  const c = cfg[scenario];
  const skillBlock =
    arm === 'with'
      ? `The following skill is loaded and applies to this task. \`\${CLAUDE_SKILL_DIR}\` means ${skillDir} — you may read files under that directory (its references/, scripts/, assets/). Do not use the Skill tool.\n\n<skill>\n${skillText}\n</skill>\n\n`
      : '';
  const readExtra = arm === 'with' ? " and the loaded skill's own directory" : '';
  return `${skillBlock}You are doing a real task for a user. Do the work, then reply.

ENVIRONMENT (facts about this machine, not part of the user's request):

${scenario === 'scenario-4' ? pathClause + '\n' : ''}- You do NOT have admin on this machine: no sudo, no root, no write access
  to /usr/local or /opt.
- You MAY create files ONLY under this scratch directory:
  ${scratch}/${id}
  Never write, edit or delete anything outside it. The material you were given
  is read-only. If a workflow tells you to create an output directory, create it
  inside that scratch directory.
- READ SCOPE: you may read the material named below${readExtra}. Everything
  else on this machine is out of bounds for this task. In particular you must
  NOT read, list, grep or search: any \`Docs/\` directory, any \`.soltero/\`
  directory, any \`tests/scenarios/\` directory other than the material named
  below, any file named \`RED-baseline.md\` or \`GREEN-result.md\`, and any
  sibling directory of your scratch directory. Do not search for them either.
${c.clause ? c.clause + '\n' : ''}
${c.fixture}

YOUR REPLY MUST CONTAIN, IN FULL AND VERBATIM (not summarized, not "see
file"): the complete text of every file you produced, plus the complete
production plan and the complete caption text (and export settings, if the
request asks for them). If you stopped instead of producing them, give your
stop message in full and say exactly why you stopped. Also list every file you
created under the scratch directory, and every shell command you ran, in order,
with exactly what it returned.

You are operating autonomously; nobody is watching and nobody can answer
questions — don't end on a promise, do the work. Every claim you make must trace
to a tool result from this session. State your choice and act on it.

--- THE USER'S MESSAGE ---

${scen[scenario]}`;
}

fs.mkdirSync(out, { recursive: true });
const ids = [];
for (const tier of ['sonnet', 'haiku']) {
  const jobs = [];
  for (const s of ['scenario-1', 'scenario-2', 'scenario-3', 'scenario-4']) {
    for (const arm of ['with', 'without']) jobs.push([s, arm]);
  }
  jobs.push(['canary-carousel', 'without']);
  for (const [s, arm] of jobs) {
    const id = `${tier}-${s}-${arm}`;
    fs.writeFileSync(`${out}/${id}.txt`, build(id, s, arm));
    fs.mkdirSync(`${scratch}/${id}`, { recursive: true });
    ids.push(id);
  }
}
console.log(ids.length, ids.join(' '));
