import Link from 'next/link';

import { formatProjectDate } from '@/utils/projects/project-mappers';
import type { ProjectTimelineEntry } from '@/utils/projects/project-types';

type ProjectTimelineProps = {
  timeline: ProjectTimelineEntry[];
};

const KIND_LABELS: Record<ProjectTimelineEntry['kind'], string> = {
  project: 'Project',
  execution: 'Execution',
  document: 'Document',
  knowledge: 'Knowledge',
  automation: 'Automation',
};

export function ProjectTimeline({ timeline }: ProjectTimelineProps) {
  return (
    <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4 sm:p-5">
      <header className="mb-4">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Timeline</h2>
      </header>

      {timeline.length === 0 ? (
        <p className="text-sm text-[var(--text-secondary)]">No timeline events yet.</p>
      ) : (
        <ol className="space-y-3">
          {timeline.map((entry) => (
            <li
              key={entry.id}
              className="flex items-start justify-between gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-0)] px-3 py-2"
            >
              <div>
                <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">
                  {KIND_LABELS[entry.kind]}
                </p>
                {entry.href ? (
                  <Link href={entry.href} className="text-sm font-medium text-[var(--accent)]">
                    {entry.title}
                  </Link>
                ) : (
                  <p className="text-sm font-medium text-[var(--text-primary)]">{entry.title}</p>
                )}
              </div>
              <time className="shrink-0 text-xs text-[var(--text-secondary)]">
                {formatProjectDate(entry.timestamp)}
              </time>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
