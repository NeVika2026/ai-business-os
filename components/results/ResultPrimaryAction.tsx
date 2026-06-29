import Link from 'next/link';

import type { ResultPrimaryActionData, ResultSecondaryActionData } from '@/utils/results/result-mappers';

type ResultPrimaryActionProps = {
  primary: ResultPrimaryActionData;
  secondary: ResultSecondaryActionData;
};

export function ResultPrimaryAction({ primary, secondary }: ResultPrimaryActionProps) {
  return (
    <section className="space-y-3" aria-label="Next action">
      <Link
        href={primary.href}
        className="inline-flex w-full items-center justify-center rounded-xl bg-[var(--accent)] px-5 py-3.5 text-sm font-semibold text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] sm:w-auto"
      >
        {primary.label}
        <span aria-hidden="true" className="ml-2">
          →
        </span>
      </Link>
      <Link
        href={secondary.href}
        className="inline-flex text-sm font-medium text-[var(--accent)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
      >
        {secondary.label}
      </Link>
    </section>
  );
}
