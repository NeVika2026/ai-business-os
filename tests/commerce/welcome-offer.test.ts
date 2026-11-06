import assert from 'node:assert/strict';
import test from 'node:test';

import { getWelcomeOffer } from '../../utils/commerce/welcome-offer';

test('keeps welcome price active during the first 24 hours', () => {
  const result = getWelcomeOffer(
    '2026-11-06T00:00:00.000Z',
    new Date('2026-11-06T12:00:00.000Z'),
    2990,
    1490,
  );

  assert.equal(result.active, true);
  assert.equal(result.price, 1490);
  assert.equal(result.savings, 1500);
  assert.equal(result.expiresAt.toISOString(), '2026-11-07T00:00:00.000Z');
});

test('expires permanently after 24 hours', () => {
  const result = getWelcomeOffer(
    '2026-11-05T00:00:00.000Z',
    new Date('2026-11-06T00:00:01.000Z'),
    2990,
    1490,
  );

  assert.equal(result.active, false);
  assert.equal(result.price, 2990);
  assert.equal(result.remainingMs, 0);
});

test('does not create extra time when createdAt is in the future', () => {
  const result = getWelcomeOffer(
    '2026-11-07T00:00:00.000Z',
    new Date('2026-11-06T00:00:00.000Z'),
    2990,
    1490,
  );

  assert.equal(result.active, false);
  assert.equal(result.price, 2990);
  assert.equal(result.remainingMs, 0);
});

test('never returns a negative or higher welcome price', () => {
  const result = getWelcomeOffer(
    '2026-11-06T00:00:00.000Z',
    new Date('2026-11-06T01:00:00.000Z'),
    2990,
    3990,
  );

  assert.equal(result.price, 2990);
  assert.equal(result.savings, 0);
});
