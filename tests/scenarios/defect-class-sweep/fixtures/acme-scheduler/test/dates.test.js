import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatShort, daysBetween } from '../src/lib/dates.js';

test('formatShort renders local m/d/yyyy', () => {
  assert.equal(formatShort(new Date(2026, 2, 14)), '3/14/2026');
});

test('daysBetween counts whole days', () => {
  assert.equal(daysBetween(new Date(2026, 2, 1), new Date(2026, 2, 8)), 7);
});
