import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { buildServer } from '../dist/server.js';

const repoSkills = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', 'skills');

async function connectedClient(skillsDir = repoSkills) {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: 'test', version: '1.0.0' });
  const server = buildServer({ skillsDir });
  await Promise.all([client.connect(clientTransport), server.connect(serverTransport)]);
  return { client, server };
}

function json(result) {
  return JSON.parse(result.content[0].text);
}

// ---- Integration: registration + wire shapes over the in-memory transport ----

test('integration: lists all tools, resources templates, and prompts', async () => {
  const { client, server } = await connectedClient();
  const tools = await client.listTools();
  assert.deepEqual(
    tools.tools.map(t => t.name).sort(),
    ['get_skill', 'lint_skill', 'list_skills', 'scaffold_skill', 'search_skills'],
  );
  const templates = await client.listResourceTemplates();
  assert.deepEqual(
    templates.resourceTemplates.map(r => r.uriTemplate).sort(),
    ['skill://{name}', 'skill://{name}/file/{+path}'],
  );
  const prompts = await client.listPrompts();
  assert.deepEqual(prompts.prompts.map(p => p.name).sort(), ['route-task', 'use-skill']);
  await server.close();
});

test('integration: list_skills returns the real library, then get_skill fetches one', async () => {
  const { client, server } = await connectedClient();
  const list = json(await client.callTool({ name: 'list_skills', arguments: {} }));
  assert.equal(list.skills.length, 50);
  assert.deepEqual(list.warnings, []);
  assert.ok(list.skills.every(s => s.name && s.description && s.path));

  const got = json(await client.callTool({
    name: 'get_skill', arguments: { name: 'lean-tdd' },
  }));
  assert.equal(got.name, 'lean-tdd');
  assert.ok(got.body.includes('name: lean-tdd'));
  assert.ok(Array.isArray(got.files));
  await server.close();
});

test('get_skill include_files inlines bundled file contents', async () => {
  const { client, server } = await connectedClient();
  const without = json(await client.callTool({
    name: 'get_skill', arguments: { name: 'build-mcp-server' },
  }));
  assert.ok(without.files.some(f => f.path === 'reference.md'));
  assert.equal(without.files[0].content, undefined);

  const withFiles = json(await client.callTool({
    name: 'get_skill', arguments: { name: 'build-mcp-server', include_files: true },
  }));
  const ref = withFiles.files.find(f => f.path === 'reference.md');
  assert.ok(ref.content.includes('Build MCP Server'));
  await server.close();
});

test('get_skill unknown name is a typed error with close matches', async () => {
  const { client, server } = await connectedClient();
  const res = await client.callTool({
    name: 'get_skill', arguments: { name: 'lean-td' },
  });
  assert.equal(res.isError, true);
  assert.ok(res.content[0].text.includes('Unknown skill'));
  assert.ok(res.content[0].text.includes('lean-tdd'));

  const noMatch = await client.callTool({
    name: 'get_skill', arguments: { name: 'zzz-nope' },
  });
  assert.equal(noMatch.isError, true);
  assert.ok(noMatch.content[0].text.includes('No close matches'));
  await server.close();
});

test('search_skills ranks name > description > body, case-insensitive', async () => {
  const { client, server } = await connectedClient();
  const res = json(await client.callTool({
    name: 'search_skills', arguments: { query: 'DEBUGGING' },
  }));
  assert.ok(res.results.length > 0);
  assert.equal(res.results[0].name, 'lean-debugging');
  assert.equal(res.results[0].matched_in, 'name');

  const none = json(await client.callTool({
    name: 'search_skills', arguments: { query: 'zzz-no-such-thing' },
  }));
  assert.deepEqual(none.results, []);
  await server.close();
});

test('lint_skill lints by name, by content, and rejects bad arg combos', async () => {
  const { client, server } = await connectedClient();

  const byName = json(await client.callTool({
    name: 'lint_skill', arguments: { name: 'lean-tdd' },
  }));
  assert.deepEqual(byName.errors, []);

  const badContent = json(await client.callTool({
    name: 'lint_skill',
    arguments: { content: '---\nname: Bad Name\n---\n# x\n' },
  }));
  assert.ok(badContent.errors.some(e => e.includes('lowercase')));
  assert.ok(badContent.errors.some(e => e.includes('description')));

  const noFm = json(await client.callTool({
    name: 'lint_skill', arguments: { content: '# just markdown\n' },
  }));
  assert.deepEqual(noFm.errors, ['missing YAML frontmatter']);

  const neither = await client.callTool({ name: 'lint_skill', arguments: {} });
  assert.equal(neither.isError, true);

  const both = await client.callTool({
    name: 'lint_skill',
    arguments: { name: 'lean-tdd', content: '---\nname: x\ndescription: y\n---\n' },
  });
  assert.equal(both.isError, true);

  const unknown = await client.callTool({
    name: 'lint_skill', arguments: { name: 'lean-td' },
  });
  assert.equal(unknown.isError, true);
  assert.ok(unknown.content[0].text.includes('lean-tdd'));
  await server.close();
});

test('scaffold_skill writes a skeleton, then refuses duplicates and bad names', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'soltero-skills-scaffold-'));
  mkdirSync(join(dir, 'existing-skill'));
  writeFileSync(join(dir, 'existing-skill', 'SKILL.md'),
    '---\nname: existing-skill\ndescription: Use when testing.\n---\n# x\n');
  const { client, server } = await connectedClient(dir);

  const made = json(await client.callTool({
    name: 'scaffold_skill',
    arguments: { name: 'my-new-skill', description: 'Use when trying things out.' },
  }));
  assert.ok(made.created.endsWith(join('my-new-skill', 'SKILL.md')));
  assert.ok(existsSync(made.created));
  const onDisk = readFileSync(made.created, 'utf8');
  assert.ok(onDisk.includes('name: my-new-skill'));
  assert.ok(onDisk.includes('## Rationalization Table'));

  // The new skill is immediately discoverable and lint-clean.
  const lint = json(await client.callTool({
    name: 'lint_skill', arguments: { name: 'my-new-skill' },
  }));
  assert.deepEqual(lint.errors, []);

  const dupe = await client.callTool({
    name: 'scaffold_skill',
    arguments: { name: 'my-new-skill', description: 'Use when testing.' },
  });
  assert.equal(dupe.isError, true);
  assert.ok(dupe.content[0].text.includes('already exists'));

  const badName = await client.callTool({
    name: 'scaffold_skill',
    arguments: { name: 'Claude', description: 'Use when testing.' },
  });
  assert.equal(badName.isError, true);
  await server.close();
});

test('warnings surface in list_skills without failing the call', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'soltero-skills-warn-'));
  mkdirSync(join(dir, 'ok-skill'));
  writeFileSync(join(dir, 'ok-skill', 'SKILL.md'),
    '---\nname: ok-skill\ndescription: Use when testing.\n---\n# x\n');
  mkdirSync(join(dir, 'broken-skill'));
  writeFileSync(join(dir, 'broken-skill', 'SKILL.md'), '# no frontmatter\n');
  const { client, server } = await connectedClient(dir);

  const res = await client.callTool({ name: 'list_skills', arguments: {} });
  assert.equal(res.isError, undefined);
  const list = json(res);
  assert.deepEqual(list.skills.map(s => s.name), ['ok-skill']);
  assert.equal(list.warnings.length, 1);
  assert.ok(list.warnings[0].includes('broken-skill'));
  await server.close();
});

test('resources: skill://<name> and skill://<name>/file/<path>', async () => {
  const { client, server } = await connectedClient();

  const listed = await client.listResources();
  assert.ok(listed.resources.some(r => r.uri === 'skill://lean-tdd'));

  const body = await client.readResource({ uri: 'skill://lean-tdd' });
  assert.ok(body.contents[0].text.includes('name: lean-tdd'));

  const file = await client.readResource({
    uri: 'skill://build-mcp-server/file/templates/server.ts',
  });
  assert.ok(file.contents[0].text.includes('McpServer'));

  await assert.rejects(
    client.readResource({ uri: 'skill://no-such-skill' }),
    /Unknown skill/,
  );
  await assert.rejects(
    client.readResource({ uri: 'skill://lean-tdd/file/no-such-file.md' }),
    /no bundled file/,
  );
  // Traversal attempts are rejected, not served.
  await assert.rejects(
    client.readResource({ uri: 'skill://build-mcp-server/file/..%2F..%2Fpackage.json' }),
  );
  await server.close();
});

test('prompts: route-task returns routing rule + index + task; use-skill returns the body', async () => {
  const { client, server } = await connectedClient();

  const route = await client.getPrompt({
    name: 'route-task', arguments: { task: 'fix a flaky test' },
  });
  const routeText = route.messages[0].content.text;
  assert.ok(routeText.includes('## The rule'));
  assert.ok(routeText.includes('lean-debugging'));
  assert.ok(routeText.includes('fix a flaky test'));

  const use = await client.getPrompt({
    name: 'use-skill', arguments: { name: 'lean-tdd' },
  });
  const useText = use.messages[0].content.text;
  assert.ok(useText.includes('Follow these instructions for the rest of the session'));
  assert.ok(useText.includes('name: lean-tdd'));

  const unknown = await client.getPrompt({
    name: 'use-skill', arguments: { name: 'lean-td' },
  });
  assert.ok(unknown.messages[0].content.text.includes('lean-tdd'));
  await server.close();
});
