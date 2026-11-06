import assert from 'node:assert/strict';
import test from 'node:test';
import { generateKeyPairSync, createSign } from 'node:crypto';

import {
  classifyTochkaPaymentStatus,
  verifyTochkaWebhookJwt,
} from '../../services/payments/tochka-webhook';

function b64url(value: string | Buffer) {
  return Buffer.from(value).toString('base64url');
}

function signJwt(payload: Record<string, unknown>, privateKey: string) {
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const body = b64url(JSON.stringify(payload));
  const signingInput = `${header}.${body}`;
  const signer = createSign('RSA-SHA256');
  signer.update(signingInput);
  signer.end();
  const signature = signer.sign(privateKey).toString('base64url');
  return `${signingInput}.${signature}`;
}

test('verifies a valid RS256 webhook and returns payload', () => {
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

  const payload = verifyTochkaWebhookJwt(token, publicKey);
  assert.equal(payload.status, 'APPROVED');
  assert.equal(payload.paymentLinkId, 'BZ-1');
});

test('rejects a modified or non-RS256 webhook', () => {
  const { publicKey, privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  const token = signJwt({ status: 'APPROVED' }, privateKey);
  const [header, body, signature] = token.split('.');
  const forgedBody = b64url(JSON.stringify({ status: 'REFUNDED' }));

  assert.throws(() => verifyTochkaWebhookJwt(`${header}.${forgedBody}.${signature}`, publicKey));

  const badHeader = b64url(JSON.stringify({ alg: 'none', typ: 'JWT' }));
  assert.throws(() => verifyTochkaWebhookJwt(`${badHeader}.${body}.${signature}`, publicKey));
});

test('only APPROVED is classified as paid', () => {
  assert.equal(classifyTochkaPaymentStatus('APPROVED'), 'paid');
  assert.equal(classifyTochkaPaymentStatus('AUTHORIZED'), 'pending');
  assert.equal(classifyTochkaPaymentStatus('CREATED'), 'pending');
  assert.equal(classifyTochkaPaymentStatus('REFUNDED'), 'refunded');
  assert.equal(classifyTochkaPaymentStatus('REFUNDED_PARTIALLY'), 'refunded_partial');
  assert.equal(classifyTochkaPaymentStatus('EXPIRED'), 'failed');
  assert.equal(classifyTochkaPaymentStatus('UNKNOWN'), 'ignored');
});
