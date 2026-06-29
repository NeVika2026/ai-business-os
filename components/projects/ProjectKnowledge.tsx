import Link from 'next/link';

import type { ProjectKnowledgeSummary } from '@/utils/projects/project-types';

type ProjectKnowledgeProps = {
  knowledge: ProjectKnowledgeSummary;
};

export function ProjectKnowledge({ knowledge }: ProjectKnowledgeProps) {
  return (
    <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4 sm:p-5">
      <header className="mb-4">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Knowledge</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Connected knowledge bases and AI memory usage
        </p>
      </header>

      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <Stat label="Documents" value={String(knowledge.documentCount)} />
        <Stat label="AI memory entries" value={String(knowledge.memoryCount)} />
      </div>

      {knowledge.bases.length === 0 ? (
        <p className="text-sm text-[var(--text-secondary)]">No knowledge bases connected.</p>
      ) : (
        <ul className="space-y-2">
          {knowledge.bases.map((base) => (
            <li key={base.id}>
              <Link
                href={base.href}
                className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-0)] px-3 py-2 hover:border-[var(--accent)]"
              >
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">{base.name}</p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {base.type} · {base.status}
                  </p>
                </div>
                <span className="text-xs font-semibold text-[var(--text-secondary)]">
                  {base.itemCount} items
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-0)] p-3">
      <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">{label}</p>
      <p className="mt-1 text-lg font-semibold text-[var(--text-primary)]">{value}</p>
    </div>
  );
}
