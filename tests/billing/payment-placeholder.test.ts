import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  buildPaymentPlaceholder,
  PAYMENT_PLACEHOLDER_RESULT_THRESHOLD,
} from '@/utils/billing/payment-placeholder';

describe('payment placeholder', () => {
  it('stays hidden before the third completed result', () => {
    const payment = buildPaymentPlaceholder(PAYMENT_PLACEHOLDER_RESULT_THRESHOLD - 1);

    assert.equal(payment.show, false);
  });

  it('shows upgrade prompt after the third completed result', () => {
    const payment = buildPaymentPlaceholder(PAYMENT_PLACEHOLDER_RESULT_THRESHOLD);

    assert.equal(payment.show, true);
    assert.match(payment.headline, /momentum/i);
    assert.equal(payment.ctaHref, '/settings');
  });
});
