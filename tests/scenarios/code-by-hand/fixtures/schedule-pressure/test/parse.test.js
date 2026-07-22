import test from 'node:test';
import assert from 'node:assert/strict';
import { parseLine } from '../src/parse.js';

test('splits and trims cells', () => {
  assert.deepEqual(parseLine(' a , b ,c'), ['a', 'b', 'c']);
});
