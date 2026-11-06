import assert from 'node:assert/strict';
import test from 'node:test';

import { createOrderQuote } from '../../utils/commerce/order-quote';

test('freezes exact integer kopeck fee math', () => {
  const quote = createOrderQuote({
    regularPriceKopecks: 2490000,
    salePriceKopecks: 1990000,
    platformFeeBps: 2000,
  });

  assert.equal(quote.regularPriceKopecks, 2490000);
  assert.equal(quote.salePriceKopecks, 1990000);
  assert.equal(quote.discountKopecks, 500000);
  assert.equal(quote.platformFeeKopecks, 398000);
  assert.equal(quote.sellerNetKopecks, 1592000);
  assert.equal(quote.platformFeeKopecks + quote.sellerNetKopecks, quote.salePriceKopecks);
});

test('rounds platform fee to the nearest kopeck without losing money', () => {
  const quote = createOrderQuote({
    regularPriceKopecks: 100,
    salePriceKopecks: 99,
    platformFeeBps: 3333,
  });

  assert.equal(quote.platformFeeKopecks, 33);
  assert.equal(quote.sellerNetKopecks, 66);
  assert.equal(quote.platformFeeKopecks + quote.sellerNetKopecks, 99);
});

test('rejects negative and non-integer amounts', () => {
  assert.throws(() => createOrderQuote({
    regularPriceKopecks: -1,
    salePriceKopecks: 0,
    platformFeeBps: 1000,
  }));
  assert.throws(() => createOrderQuote({
    regularPriceKopecks: 1000.5,
    salePriceKopecks: 1000,
    platformFeeBps: 1000,
  }));
});

test('rejects sale price above regular price and invalid basis points', () => {
  assert.throws(() => createOrderQuote({
    regularPriceKopecks: 1000,
    salePriceKopecks: 1200,
    platformFeeBps: 1000,
  }));
  assert.throws(() => createOrderQuote({
    regularPriceKopecks: 1000,
    salePriceKopecks: 900,
    platformFeeBps: 10001,
  }));
});
