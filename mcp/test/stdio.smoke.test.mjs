import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import readline from 'node:readline';

const stdioJs = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'dist', 'stdio.js');

// Drives a real stdio handshake: initialize -> initialized -> tools/list -> tools/call.
// Asserts EVERY stdout line is valid JSON-RPC (a single stray log line would fail here).
test('stdio smoke: handshake, tools/list, and a real call — stdout stays pure JSON-RPC', async () => {
  const child = spawn(process.execPath, [stdioJs], { stdio: ['pipe', 'pipe', 'pipe'] });
  const rl = readline.createInterface({ input: child.stdout });
  const responses = new Map();
  let stderr = '';
  child.stderr.on('data', d => { stderr += d; });

  const lines = [];
  rl.on('line', line => {
    lines.push(line);
    // THE STDOUT RULE: every line on stdout must be a JSON-RPC message.
    const msg = JSON.parse(line); // throws -> test fails: stdout was corrupted
    assert.equal(msg.jsonrpc, '2.0', `non-JSON-RPC stdout line: ${line}`);
    if (msg.id !== undefined) responses.set(msg.id, msg);
  });

  const waitFor = id => new Promise((resolvePromise, reject) => {
    const deadline = setTimeout(() => reject(new Error(`timeout waiting for id ${id}; stderr: ${stderr}`)), 10000);
    const poll = () => {
      if (responses.has(id)) { clearTimeout(deadline); resolvePromise(responses.get(id)); }
      else setTimeout(poll, 25);
    };
    poll();
  });

  const send = msg => child.stdin.write(JSON.stringify(msg) + '\n');

  send({
    jsonrpc: '2.0', id: 1, method: 'initialize',
    params: {
      protocolVersion: '2025-11-25',
      capabilities: {},
      clientInfo: { name: 'stdio-smoke', version: '0.0.0' },
    },
  });
  const init = await waitFor(1);
  assert.equal(init.result.serverInfo.name, 'soltero-skills');

  send({ jsonrpc: '2.0', method: 'notifications/initialized' });
  send({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} });
  const tools = await waitFor(2);
  const names = tools.result.tools.map(t => t.name);
  assert.ok(names.includes('list_skills') && names.includes('get_skill'));

  send({
    jsonrpc: '2.0', id: 3, method: 'tools/call',
    params: { name: 'get_skill', arguments: { name: 'lean-tdd' } },
  });
  const call = await waitFor(3);
  const payload = JSON.parse(call.result.content[0].text);
  assert.equal(payload.name, 'lean-tdd');

  assert.ok(lines.length >= 3, 'expected at least 3 JSON-RPC responses on stdout');
  child.kill('SIGTERM');
  await new Promise(r => child.on('exit', r));
});

test('stdio smoke: missing skills dir fails fast with a clear stderr message', async () => {
  const child = spawn(process.execPath, [stdioJs], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, SOLTERO_SKILLS_DIR: '/definitely/not/a/skills/dir' },
  });
  let stdout = '';
  let stderr = '';
  child.stdout.on('data', d => { stdout += d; });
  child.stderr.on('data', d => { stderr += d; });
  const code = await new Promise(r => child.on('exit', r));
  assert.equal(code, 1);
  assert.match(stderr, /Skills directory not found/);
  assert.equal(stdout, '', 'stdout must stay clean even on fatal errors');
});
