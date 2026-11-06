import assert from 'node:assert/strict';
import test from 'node:test';
import { generateKeyPairSync, createSign } from 'node:crypto';

import { parseVerifiedTochkaWebhook } from '../../services/payments/tochka-webhook-handler';

function b64url(value: string | Buffer) {
  return Buffer.from(value).toString('base64url');
}

function signJwt(payload: Record<string, unknown>, privateKey: string) {
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const body = b64url(JSON.stringify(payload));
  const input = `${header}.${body}`;
  const signer = createSign('RSA-SHA256');
  signer.update(input);
  signer.end();
  return `${input}.${signer.sign(privateKey).toString('base64url')}`;
}

test('accepts acquiringInternetPayment APPROVED as paid', () => {
  const { publicKey, privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

  const token = signJwt({
    webhookType: 'acquiringInternetPayment',
    status: 'APPROVED',
    operationId: 'op-1',
    paymentLinkId: 'BZ-1',
    amount: '1499.00',
  }, privateKey);

  const result = parseVerifiedTochkaWebhook(token, publicKey);
  assert.equal(result.state, 'paid');
  assert.equal(result.operationId, 'op-1');
  assert.equal(result.paymentLinkId, 'BZ-1');
  assert.equal(result.amount, '1499.00');
});

test('rejects wrong webhook type even with a valid signature', () => {
  const { publicKey, privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

  const token = signJwt({
    webhookType: 'someOtherWebhook',
    status: 'APPROVED',
    operationId: 'op-1',
    paymentLinkId: 'BZ-1',
  }, privateKey);

  assert.throws(() => parseVerifiedTochkaWebhook(token, publicKey), /Unexpected Tochka webhook type/);
});

test('rejects webhook without required order identifiers', () => {
  const { publicKey, privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

  const token = signJwt({
    webhookType: 'acquiringInternetPayment',
    status: 'APPROVED',
  }, privateKey);

  assert.throws(() => parseVerifiedTochkaWebhook(token, publicKey), /missing operationId or paymentLinkId/);
});
