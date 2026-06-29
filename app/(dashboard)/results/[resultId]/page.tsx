import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { PaymentPlaceholderBanner } from '@/components/results/PaymentPlaceholderBanner';
import { ResultCelebration } from '@/components/results/ResultCelebration';
import { ResultDeliverable } from '@/components/results/ResultDeliverable';
import { ResultPrimaryAction } from '@/components/results/ResultPrimaryAction';
import { ResultProjectAnchor } from '@/components/results/ResultProjectAnchor';
import { ResultRequestedProof } from '@/components/results/ResultRequestedProof';
import { ResultTimelineCollapsible } from '@/components/results/ResultTimelineCollapsible';
import { ResultActions } from '@/components/results/ResultActions';
import { ResultArtifacts } from '@/components/results/ResultArtifacts';
import { ResultHeader } from '@/components/results/ResultHeader';
import { ResultNextSteps } from '@/components/results/ResultNextSteps';
import { ResultSummary } from '@/components/results/ResultSummary';
import { ResultTimeline } from '@/components/results/ResultTimeline';
import { createClient } from '@/services/supabase/server';
import { getCurrentOrganizationId } from '@/utils/auth/organization';
import { loadResult } from '@/utils/results/result-loader';

type ResultPageProps = {
  params: Promise<{ resultId: string }>;
};

export default async function ResultPage({ params }: ResultPageProps) {
  const { resultId } = await params;
  const supabase = await createClient();
  const organizationId = await getCurrentOrganizationId(supabase);

  if (!organizationId) {
    redirect('/login');
  }

  const result = await loadResult(supabase, organizationId, resultId);

  if (!result) {
    notFound();
  }

  if (result.experience.enabled) {
    return (
      <section className="mx-auto w-full max-w-3xl space-y-6">
        <Link
          href="/home"
          className="text-sm text-[var(--accent)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
          ← Today
        </Link>

        <ResultCelebration celebration={result.celebration} />

        <header className="space-y-2">
          <h1 className="text-2xl font-semibold leading-tight text-[var(--text-primary)] sm:text-3xl">
            {result.presentationHeadline}
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">{result.experience.metaLine}</p>
        </header>

        <ResultDeliverable sections={result.experience.deliverableSections} />
        <ResultRequestedProof requested={result.summary.requested} />

        <div className="space-y-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)]">
            Do this next
          </p>
          <ResultPrimaryAction
            primary={result.experience.primaryAction}
            secondary={result.experience.secondaryAction}
          />
        </div>

        <PaymentPlaceholderBanner payment={result.experience.paymentPlaceholder} />

        <div className="flex flex-wrap items-center gap-3">
          {result.projectHref && result.projectName ? (
            <ResultProjectAnchor
              projectName={result.projectName}
              projectHref={result.projectHref}
            />
          ) : null}
          <Link
            href="/history"
            className="text-sm text-[var(--accent)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          >
            History
          </Link>
        </div>

        <ResultTimelineCollapsible timeline={result.timeline} />
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-5xl space-y-8">
      <Link
        href="/history"
        className="text-sm text-[var(--accent)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
      >
        ← History
      </Link>

      <ResultCelebration celebration={result.celebration} />
      <ResultHeader result={result} />
      <ResultSummary summary={result.summary} />
      <ResultArtifacts artifacts={result.artifacts} />
      <ResultNextSteps steps={result.nextSteps} />
      <ResultTimeline timeline={result.timeline} />
      <ResultActions actions={result.actions} />
    </section>
  );
}

export const metadata = {
  title: 'Result',
};
