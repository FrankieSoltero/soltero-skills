import test from 'node:test';
import assert from 'node:assert/strict';
import { cartTotal, lineTotal } from '../src/cart.js';

test('lineTotal multiplies', () => {
  assert.equal(lineTotal({ price: 2, qty: 3 }), 6);
});

test('cartTotal sums', () => {
  assert.equal(cartTotal([{ price: 2, qty: 3 }, { price: 1, qty: 4 }]), 10);
});
