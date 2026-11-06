import { createVerify } from 'node:crypto';

export type TochkaWebhookPayload = Record<string, unknown> & {
  webhookType?: string;
  status?: string;
  operationId?: string;
  paymentLinkId?: string;
  amount?: string | number;
};

export type TochkaPaymentState =
  | 'paid'
  | 'pending'
  | 'refunded'
  | 'refunded_partial'
  | 'failed'
  | 'ignored';

function decodeJsonPart(part: string) {
  try {
    return JSON.parse(Buffer.from(part, 'base64url').toString('utf8')) as Record<string, unknown>;
  } catch {
    throw new Error('Invalid JWT JSON');
  }
}

export function verifyTochkaWebhookJwt(
  token: string,
  publicKeyPem: string,
): TochkaWebhookPayload {
  if (!publicKeyPem.trim()) {
    throw new Error('Tochka public key is required');
  }

  const parts = token.trim().split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT format');
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const header = decodeJsonPart(encodedHeader);

  if (header.alg !== 'RS256') {
    throw new Error('Unexpected JWT algorithm');
  }

  const verifier = createVerify('RSA-SHA256');
  verifier.update(`${encodedHeader}.${encodedPayload}`);
  verifier.end();

  const valid = verifier.verify(
    publicKeyPem,
    Buffer.from(encodedSignature, 'base64url'),
  );

  if (!valid) {
    throw new Error('Invalid Tochka webhook signature');
  }

  return decodeJsonPart(encodedPayload) as TochkaWebhookPayload;
}

export function classifyTochkaPaymentStatus(status: string): TochkaPaymentState {
  switch (status) {
    case 'APPROVED':
      return 'paid';
    case 'AUTHORIZED':
    case 'CREATED':
    case 'WAIT_FULL_PAYMENT':
    case 'ON-REFUND':
      return 'pending';
    case 'REFUNDED':
      return 'refunded';
    case 'REFUNDED_PARTIALLY':
      return 'refunded_partial';
    case 'EXPIRED':
      return 'failed';
    default:
      return 'ignored';
  }
}
