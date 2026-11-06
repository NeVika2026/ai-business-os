const TOCHKA_PAYMENTS_URL = 'https://enter.tochka.com/uapi/acquiring/v1.0/payments';

export type TochkaPaymentMode = 'sbp' | 'card' | 'tinkoff' | 'dolyame';

export type TochkaPaymentRequestInput = {
  customerCode: string;
  paymentLinkId: string;
  amountKopecks: number;
  purpose: string;
  redirectUrl?: string;
  failRedirectUrl?: string;
  paymentMode: TochkaPaymentMode[];
  ttlMinutes?: number;
};

export type TochkaPaymentLink = {
  operationId: string;
  paymentLink: string;
  status: string;
  paymentLinkId?: string;
  amount?: string | number;
};

export type TochkaServerConfig = {
  token: string;
  customerCode: string;
};

export function kopecksToRubles(value: number) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error('amountKopecks must be a non-negative integer');
  }

  const rubles = Math.floor(value / 100);
  const kopecks = value % 100;
  return `${rubles}.${String(kopecks).padStart(2, '0')}`;
}

function assertUrl(value: string | undefined, field: string) {
  if (!value) return;
  const parsed = new URL(value);
  if (!['https:', 'http:'].includes(parsed.protocol)) {
    throw new Error(`${field} must be http(s)`);
  }
}

export function buildTochkaPaymentRequest(input: TochkaPaymentRequestInput) {
  if (!/^\d{9}$/.test(input.customerCode)) {
    throw new Error('customerCode must contain exactly 9 digits');
  }

  if (!input.paymentLinkId.trim() || input.paymentLinkId.length > 45) {
    throw new Error('paymentLinkId must be 1..45 characters');
  }

  if (!Number.isSafeInteger(input.amountKopecks) || input.amountKopecks <= 0) {
    throw new Error('amountKopecks must be a positive integer');
  }

  const purpose = input.purpose.trim();
  if (!purpose || purpose.length > 140) {
    throw new Error('purpose must be 1..140 characters');
  }

  if (!input.paymentMode.length) {
    throw new Error('paymentMode must contain at least one mode');
  }

  assertUrl(input.redirectUrl, 'redirectUrl');
  assertUrl(input.failRedirectUrl, 'failRedirectUrl');

  if (
    input.ttlMinutes !== undefined &&
    (!Number.isInteger(input.ttlMinutes) || input.ttlMinutes < 1 || input.ttlMinutes > 44640)
  ) {
    throw new Error('ttlMinutes must be 1..44640');
  }

  return {
    Data: {
      customerCode: input.customerCode,
      amount: kopecksToRubles(input.amountKopecks),
      purpose,
      ...(input.redirectUrl ? { redirectUrl: input.redirectUrl } : {}),
      ...(input.failRedirectUrl ? { failRedirectUrl: input.failRedirectUrl } : {}),
      paymentMode: input.paymentMode,
      ...(input.ttlMinutes ? { ttl: input.ttlMinutes } : {}),
      paymentLinkId: input.paymentLinkId,
    },
  };
}

export function validateTochkaServerConfig(config: TochkaServerConfig): TochkaServerConfig {
  if (!config.token.trim()) {
    throw new Error('TOCHKA_API_TOKEN is required');
  }
  if (!/^\d{9}$/.test(config.customerCode)) {
    throw new Error('TOCHKA_CUSTOMER_CODE must contain exactly 9 digits');
  }
  return config;
}

export async function createTochkaPaymentLink(
  input: Omit<TochkaPaymentRequestInput, 'customerCode'>,
  fetchImpl: typeof fetch = fetch,
): Promise<TochkaPaymentLink> {
  const config = validateTochkaServerConfig({
    token: process.env.TOCHKA_API_TOKEN ?? '',
    customerCode: process.env.TOCHKA_CUSTOMER_CODE ?? '',
  });

  const response = await fetchImpl(TOCHKA_PAYMENTS_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.token}`,
    },
    body: JSON.stringify(
      buildTochkaPaymentRequest({
        ...input,
        customerCode: config.customerCode,
      }),
    ),
    cache: 'no-store',
  });

  const payload = (await response.json()) as {
    Data?: {
      operationId?: unknown;
      paymentLink?: unknown;
      status?: unknown;
      paymentLinkId?: unknown;
      amount?: unknown;
    };
  };

  if (!response.ok) {
    throw new Error(`Tochka payment link request failed with status ${response.status}`);
  }

  const data = payload.Data;
  if (
    !data ||
    typeof data.operationId !== 'string' ||
    typeof data.paymentLink !== 'string' ||
    typeof data.status !== 'string'
  ) {
    throw new Error('Tochka returned an invalid payment-link response');
  }

  return {
    operationId: data.operationId,
    paymentLink: data.paymentLink,
    status: data.status,
    paymentLinkId: typeof data.paymentLinkId === 'string' ? data.paymentLinkId : undefined,
    amount:
      typeof data.amount === 'string' || typeof data.amount === 'number'
        ? data.amount
        : undefined,
  };
}
