'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { improveDeliverableResult } from '@/app/(dashboard)/workspace/[projectId]/actions';
import { confidenceLabel } from '@/lib/deliverables/executive-review';
import type { ProjectDeliverable, ProjectDeliverablesPackage } from '@/types/deliverables';

type ProjectResultsSectionProps = {
  projectId: string;
  deliverables: ProjectDeliverablesPackage;
};

function ExecutiveReviewPanel({ item }: { item: ProjectDeliverable }) {
  if (!item.review) {
    return null;
  }

  return (
    <div className="mt-5 rounded-[20px] bg-[var(--surface-1)] px-6 py-5">
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
        Executive Review
      </p>
      <div className="mt-4 flex flex-wrap items-baseline gap-x-8 gap-y-2">
        <p className="text-[15px] text-[var(--text-primary)]">
          Score <span className="font-medium tabular-nums">{item.review.score}</span>
        </p>
        <p className="text-[15px] text-[var(--text-secondary)]">
          Confidence <span className="font-medium">{confidenceLabel(item.review.confidence)}</span>
        </p>
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <div>
          <p className="text-[13px] font-medium text-[var(--text-primary)]">Сильные стороны</p>
          <ul className="mt-2 space-y-1 text-[14px] leading-relaxed text-[var(--text-secondary)]">
            {item.review.strengths.map((entry) => (
              <li key={entry}>• {entry}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-[13px] font-medium text-[var(--text-primary)]">Недостатки</p>
          <ul className="mt-2 space-y-1 text-[14px] leading-relaxed text-[var(--text-secondary)]">
            {item.review.weaknesses.map((entry) => (
              <li key={entry}>• {entry}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-6">
        <p className="text-[13px] font-medium text-[var(--text-primary)]">Рекомендации</p>
        <ul className="mt-2 space-y-1 text-[14px] leading-relaxed text-[var(--text-secondary)]">
          {item.review.recommendations.map((entry) => (
            <li key={entry}>• {entry}</li>
          ))}
        </ul>
      </div>

      <p className="mt-6 text-[14px] leading-relaxed text-[var(--text-secondary)]">
        <span className="font-medium text-[var(--text-primary)]">Следующее действие.</span>{' '}
        {item.review.nextAction}
      </p>
    </div>
  );
}

function VersionHistory({ item }: { item: ProjectDeliverable }) {
  if (item.versions.length === 0) {
    return null;
  }

  return (
    <div className="mt-5">
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
        Version History
      </p>
      <ul className="mt-3 space-y-2">
        {item.versions.map((version) => (
          <li key={version.version} className="text-[14px] text-[var(--text-secondary)]">
            <span className="font-medium text-[var(--text-primary)]">v{version.version}</span>{' '}
            {version.labelDisplay}
            {version.changeNotes.length > 0 ? (
              <span className="text-[var(--text-tertiary)]">
                {' '}
                — {version.changeNotes.join(' ')}
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ResultItem({
  item,
  projectId,
}: {
  item: ProjectDeliverable;
  projectId: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (item.phase !== 'ready') {
    return null;
  }

  const canImprove = item.currentVersion < 3;

  return (
    <li className="border-t border-[var(--border-subtle)]/60 py-8 first:border-t-0">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[15px] font-medium text-[var(--text-primary)]">{item.title}</p>
          <p className="mt-1 text-[14px] leading-relaxed text-[var(--text-secondary)]">{item.summary}</p>
        </div>
        {item.review ? (
          <p className="shrink-0 text-[13px] tabular-nums text-[var(--text-tertiary)]">
            {item.review.score}/100
          </p>
        ) : null}
      </div>

      <ExecutiveReviewPanel item={item} />

      <div className="mt-5 flex flex-wrap gap-3">
        {canImprove ? (
          <button
            type="button"
            disabled={isPending}
            onClick={() => {
              setError(null);

              startTransition(async () => {
                const result = await improveDeliverableResult(projectId, item.id);

                if (result.status === 'failed') {
                  setError(result.message);
                  return;
                }

                router.refresh();
              });
            }}
            className="rounded-full border border-[var(--border-subtle)] px-5 py-2.5 text-[14px] font-medium text-[var(--text-primary)] transition hover:border-[var(--text-tertiary)] disabled:opacity-50"
          >
            {isPending ? 'Executive Brain улучшает…' : 'Improve'}
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="rounded-full bg-[var(--accent)] px-5 py-2.5 text-[14px] font-medium text-white transition hover:opacity-90"
        >
          {open ? 'Hide Result' : 'View Result'}
        </button>
      </div>

      {error ? <p className="mt-3 text-sm text-red-500">{error}</p> : null}

      {open ? (
        <div className="mt-5">
          <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap rounded-[20px] bg-[var(--surface-1)] px-6 py-5 text-[14px] leading-relaxed text-[var(--text-primary)]">
            {item.content}
          </pre>
          <VersionHistory item={item} />
        </div>
      ) : null}
    </li>
  );
}

export function ProjectResultsSection({ projectId, deliverables }: ProjectResultsSectionProps) {
  const readyItems = deliverables.deliverables.filter((item) => item.phase === 'ready');

  if (readyItems.length === 0) {
    return null;
  }

  return (
    <section className="mt-16">
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
        Results
      </p>
      {deliverables.executiveSummary ? (
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-[var(--text-secondary)]">
          {deliverables.executiveSummary}
        </p>
      ) : null}
      <ul className="mt-6">
        {deliverables.deliverables.map((item) => (
          <ResultItem key={item.id} item={item} projectId={projectId} />
        ))}
      </ul>
    </section>
  );
}
