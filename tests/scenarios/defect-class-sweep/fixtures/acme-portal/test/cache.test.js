import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as cache from '../src/store/cache.js';

test('put then get returns the value', () => {
  cache.put('k', 1);
  assert.equal(cache.get('k'), 1);
});

test('invalidate clears by prefix', () => {
  cache.put('a:1', 1);
  cache.invalidate('a:');
  assert.equal(cache.get('a:1'), undefined);
});
