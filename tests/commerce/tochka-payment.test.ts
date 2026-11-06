import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildTochkaPaymentRequest,
  kopecksToRubles,
  validateTochkaServerConfig,
} from '../../services/payments/tochka';

test('formats kopecks as exact ruble decimal strings', () => {
  assert.equal(kopecksToRubles(1), '0.01');
  assert.equal(kopecksToRubles(149900), '1499.00');
  assert.equal(kopecksToRubles(2490000), '24900.00');
});

test('builds official Tochka payment-link request with unique order id', () => {
  const request = buildTochkaPaymentRequest({
    customerCode: '300000092',
    paymentLinkId: 'BZ-20261106-000001',
    amountKopecks: 149900,
    purpose: 'Курс ЁПТЕТЬ ДА НУ!',
    redirectUrl: 'https://business-zavod.vercel.app/cabinet',
    failRedirectUrl: 'https://business-zavod.vercel.app/cabinet?payment=failed',
    paymentMode: ['sbp', 'card'],
    ttlMinutes: 1440,
  });

  assert.deepEqual(request, {
    Data: {
      customerCode: '300000092',
      amount: '1499.00',
      purpose: 'Курс ЁПТЕТЬ ДА НУ!',
      redirectUrl: 'https://business-zavod.vercel.app/cabinet',
      failRedirectUrl: 'https://business-zavod.vercel.app/cabinet?payment=failed',
      paymentMode: ['sbp', 'card'],
      ttl: 1440,
      paymentLinkId: 'BZ-20261106-000001',
    },
  });
});

test('rejects invalid payment ids, amounts and purpose', () => {
  assert.throws(() => buildTochkaPaymentRequest({
    customerCode: '300000092',
    paymentLinkId: '',
    amountKopecks: 149900,
    purpose: 'Test',
    paymentMode: ['card'],
  }));

  assert.throws(() => buildTochkaPaymentRequest({
    customerCode: '300000092',
    paymentLinkId: 'ORDER-1',
    amountKopecks: 0,
    purpose: 'Test',
    paymentMode: ['card'],
  }));

  assert.throws(() => buildTochkaPaymentRequest({
    customerCode: '300000092',
    paymentLinkId: 'ORDER-1',
    amountKopecks: 100,
    purpose: '',
    paymentMode: ['card'],
  }));
});

test('requires server-only token and customer code for live calls', () => {
  assert.throws(() => validateTochkaServerConfig({ token: '', customerCode: '300000092' }));
  assert.throws(() => validateTochkaServerConfig({ token: 'secret', customerCode: '' }));
  assert.deepEqual(
    validateTochkaServerConfig({ token: 'secret', customerCode: '300000092' }),
    { token: 'secret', customerCode: '300000092' },
  );
});
