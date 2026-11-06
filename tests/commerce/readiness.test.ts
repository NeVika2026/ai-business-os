import assert from 'node:assert/strict';
import test from 'node:test';

import { getCommerceReadiness } from '../../utils/commerce/readiness';

test('reports checkout disabled when live server credentials are missing', () => {
  const result = getCommerceReadiness({
    TOCHKA_API_TOKEN: '',
    TOCHKA_CUSTOMER_CODE: '',
    TOCHKA_PUBLIC_KEY: '',
    SUPABASE_SECRET_KEY: '',
  });

  assert.equal(result.checkoutReady, false);
  assert.equal(result.webhookReady, false);
  assert.deepEqual(result.missing.sort(), [
    'SUPABASE_SECRET_KEY',
    'TOCHKA_API_TOKEN',
    'TOCHKA_CUSTOMER_CODE',
    'TOCHKA_PUBLIC_KEY',
  ]);
});

test('reports checkout and webhook ready only with all required server config', () => {
  const result = getCommerceReadiness({
    TOCHKA_API_TOKEN: 'token',
    TOCHKA_CUSTOMER_CODE: '300000092',
    TOCHKA_PUBLIC_KEY: '-----BEGIN PUBLIC KEY-----\nabc\n-----END PUBLIC KEY-----',
    SUPABASE_SECRET_KEY: 'sb_secret_example',
  });

  assert.equal(result.checkoutReady, true);
  assert.equal(result.webhookReady, true);
  assert.deepEqual(result.missing, []);
});
