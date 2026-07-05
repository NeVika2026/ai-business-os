'use client';

import { useState } from 'react';

import type { ProjectDeliverable, ProjectDeliverablesPackage } from '@/types/deliverables';

type ProjectResultsSectionProps = {
  deliverables: ProjectDeliverablesPackage;
};

function ResultItem({ item }: { item: ProjectDeliverable }) {
  const [open, setOpen] = useState(false);

  if (item.phase !== 'ready') {
    return null;
  }

  return (
    <li className="border-t border-[var(--border-subtle)]/60 first:border-t-0">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-baseline justify-between gap-6 py-5 text-left transition hover:opacity-80"
      >
        <div className="min-w-0">
          <p className="text-[15px] font-medium text-[var(--text-primary)]">{item.title}</p>
          <p className="mt-1 text-[14px] leading-relaxed text-[var(--text-secondary)]">{item.summary}</p>
        </div>
        <span className="shrink-0 text-[13px] text-[var(--text-tertiary)]">{open ? '↑' : '→'}</span>
      </button>
      {open ? (
        <div className="pb-6">
          <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap rounded-[20px] bg-[var(--surface-1)] px-6 py-5 text-[14px] leading-relaxed text-[var(--text-primary)]">
            {item.content}
          </pre>
        </div>
      ) : null}
    </li>
  );
}

export function ProjectResultsSection({ deliverables }: ProjectResultsSectionProps) {
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
          <ResultItem key={item.id} item={item} />
        ))}
      </ul>
    </section>
  );
}
