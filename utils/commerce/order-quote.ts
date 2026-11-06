export type OrderQuoteInput = {
  regularPriceKopecks: number;
  salePriceKopecks: number;
  platformFeeBps: number;
};

export type OrderQuote = {
  regularPriceKopecks: number;
  salePriceKopecks: number;
  discountKopecks: number;
  platformFeeBps: number;
  platformFeeKopecks: number;
  sellerNetKopecks: number;
};

function assertMoney(value: number, field: string) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${field} must be a non-negative integer number of kopecks`);
  }
}

export function createOrderQuote(input: OrderQuoteInput): OrderQuote {
  assertMoney(input.regularPriceKopecks, 'regularPriceKopecks');
  assertMoney(input.salePriceKopecks, 'salePriceKopecks');

  if (!Number.isInteger(input.platformFeeBps) || input.platformFeeBps < 0 || input.platformFeeBps > 10000) {
    throw new Error('platformFeeBps must be an integer from 0 to 10000');
  }

  if (input.salePriceKopecks > input.regularPriceKopecks) {
    throw new Error('salePriceKopecks cannot exceed regularPriceKopecks');
  }

  const platformFeeKopecks = Math.round(
    (input.salePriceKopecks * input.platformFeeBps) / 10000,
  );
  const sellerNetKopecks = input.salePriceKopecks - platformFeeKopecks;

  return {
    regularPriceKopecks: input.regularPriceKopecks,
    salePriceKopecks: input.salePriceKopecks,
    discountKopecks: input.regularPriceKopecks - input.salePriceKopecks,
    platformFeeBps: input.platformFeeBps,
    platformFeeKopecks,
    sellerNetKopecks,
  };
}
