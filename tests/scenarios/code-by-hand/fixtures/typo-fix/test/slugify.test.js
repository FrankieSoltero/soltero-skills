import test from 'node:test';
import assert from 'node:assert/strict';
import { slugify } from '../src/slugify.js';

test('basic phrase', () => {
  assert.equal(slugify('Hello, World!'), 'hello-world');
});

test('leading/trailing junk', () => {
  assert.equal(slugify('  --Already Slugged--  '), 'already-slugged');
});
