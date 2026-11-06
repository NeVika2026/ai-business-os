import {
  classifyTochkaPaymentStatus,
  verifyTochkaWebhookJwt,
  type TochkaPaymentState,
} from './tochka-webhook';

export type VerifiedTochkaWebhook = {
  state: TochkaPaymentState;
  operationId: string;
  paymentLinkId: string;
  amount?: string | number;
  status: string;
};

export function parseVerifiedTochkaWebhook(
  token: string,
  publicKeyPem: string,
): VerifiedTochkaWebhook {
  const payload = verifyTochkaWebhookJwt(token, publicKeyPem);

  if (payload.webhookType !== 'acquiringInternetPayment') {
    throw new Error('Unexpected Tochka webhook type');
  }

  if (
    typeof payload.operationId !== 'string' ||
    !payload.operationId.trim() ||
    typeof payload.paymentLinkId !== 'string' ||
    !payload.paymentLinkId.trim()
  ) {
    throw new Error('Tochka webhook missing operationId or paymentLinkId');
  }

  if (typeof payload.status !== 'string' || !payload.status.trim()) {
    throw new Error('Tochka webhook missing status');
  }

  return {
    state: classifyTochkaPaymentStatus(payload.status),
    operationId: payload.operationId,
    paymentLinkId: payload.paymentLinkId,
    amount: payload.amount,
    status: payload.status,
  };
}
