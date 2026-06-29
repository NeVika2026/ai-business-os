export const PAYMENT_PLACEHOLDER_RESULT_THRESHOLD = 3;
export const FREE_RESULTS_PER_MONTH = 5;

export type PaymentPlaceholderData = {
  show: boolean;
  headline: string;
  message: string;
  ctaLabel: string;
  ctaHref: string;
};

export function buildPaymentPlaceholder(completedResultsCount: number): PaymentPlaceholderData {
  if (completedResultsCount < PAYMENT_PLACEHOLDER_RESULT_THRESHOLD) {
    return {
      show: false,
      headline: '',
      message: '',
      ctaLabel: '',
      ctaHref: '',
    };
  }

  const remaining = Math.max(0, FREE_RESULTS_PER_MONTH - completedResultsCount);

  return {
    show: true,
    headline: "You're building momentum.",
    message: `${remaining} results left this month on the free plan.`,
    ctaLabel: 'Keep your projects and history — upgrade',
    ctaHref: '/settings',
  };
}
