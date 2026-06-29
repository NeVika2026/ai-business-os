import Link from 'next/link';

import type { PaymentPlaceholderData } from '@/utils/billing/payment-placeholder';

type PaymentPlaceholderBannerProps = {
  payment: PaymentPlaceholderData;
};

export function PaymentPlaceholderBanner({ payment }: PaymentPlaceholderBannerProps) {
  if (!payment.show) {
    return null;
  }

  return (
    <section
      className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] px-5 py-4"
      aria-label="Plan usage"
    >
      <p className="font-medium text-[var(--text-primary)]">{payment.headline}</p>
      <p className="mt-1 text-sm text-[var(--text-secondary)]">{payment.message}</p>
      <Link
        href={payment.ctaHref}
        className="mt-4 inline-flex rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-0)] px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface-1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
      >
        {payment.ctaLabel}
      </Link>
    </section>
  );
}
