import type { FindClientsSection } from '@/utils/results/find-clients-deliverable';

import { ResultCopyButton } from './ResultCopyButton';

type ResultDeliverableProps = {
  sections: FindClientsSection[];
};

function renderBody(body: string) {
  return body.split('\n').map((line, index) => (
    <span key={`${index}-${line}`}>
      {line}
      {index < body.split('\n').length - 1 ? <br /> : null}
    </span>
  ));
}

export function ResultDeliverable({ sections }: ResultDeliverableProps) {
  if (sections.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4" aria-label="Deliverable">
      {sections.map((section) => (
        <article
          key={section.id}
          id={section.id === 'outreach-draft' ? 'outreach-draft' : undefined}
          className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
              {section.title}
            </h2>
            {section.copyable ? <ResultCopyButton text={section.body} /> : null}
          </div>
          <div className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[var(--text-primary)]">
            {renderBody(section.body)}
          </div>
        </article>
      ))}
    </section>
  );
}
