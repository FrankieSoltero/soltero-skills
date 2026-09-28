import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkYamlSafety } from './frontmatter.mjs';

const doc = (line) => `---\nname: x\n${line}\n---\n\n# Body\n`;

test('an unquoted value containing ": " is flagged — strict YAML parsers reject it', () => {
  const errors = checkYamlSafety(doc('description: Use when X — the discipline: no code first.'));
  assert.equal(errors.length, 1);
  assert.match(errors[0], /description/);
});

test('an unquoted value containing " #" is flagged — YAML would drop the rest as a comment', () => {
  assert.equal(checkYamlSafety(doc('description: Use when fixing issue #12 or #13')).length, 1);
});

test('plain values, quoted values and colons without a following space pass', () => {
  assert.deepEqual(checkYamlSafety(doc('description: Use when writing a PRD — scope, metrics, stories.')), []);
  assert.deepEqual(checkYamlSafety(doc('description: "Use when X: quoted is fine"')), []);
  assert.deepEqual(checkYamlSafety(doc("description: 'single: quoted too'")), []);
  assert.deepEqual(checkYamlSafety(doc('description: see https://example.com/a#b and 10:30')), []);
});

test('CRLF frontmatter is checked the same way', () => {
  const crlf = '---\r\nname: x\r\ndescription: bad: value\r\n---\r\n';
  assert.equal(checkYamlSafety(crlf).length, 1);
});

test('no frontmatter means nothing to check', () => {
  assert.deepEqual(checkYamlSafety('# just a heading\n'), []);
});
