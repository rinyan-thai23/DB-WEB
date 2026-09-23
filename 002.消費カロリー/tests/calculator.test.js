import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calories, duration } from '../src/calculator.js';
test('published formula and rounding', () => {
  assert.equal(Math.round(calories(3.3, 70, 30)), 121);
  assert.equal(calories(3, 70, 30), 110.25);
  assert.equal(calories(3, 70, 0), 0);
});
test('inverse calculation round trip', () => {
  assert.ok(Math.abs(calories(3.8, 70, duration(3.8, 70, 500)) - 500) < 1e-10);
});
test('reject invalid inputs', () => {
  for (const x of [NaN, Infinity, -1, 0]) assert.throws(() => calories(3, x, 30));
  assert.throws(() => calories(3, 70, -1));
  assert.throws(() => duration(0, 70, 500));
});
