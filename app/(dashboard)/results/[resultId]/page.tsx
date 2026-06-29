import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

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

  return (
    <section className="mx-auto w-full max-w-5xl space-y-8">
      <Link
        href="/history"
        className="text-sm text-[var(--accent)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
      >
        ← History
      </Link>

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
