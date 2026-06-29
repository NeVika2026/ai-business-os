import Link from 'next/link';

import { formatProjectDate } from '@/utils/projects/project-mappers';
import type { ProjectExecution } from '@/utils/projects/project-types';

type ProjectExecutionsProps = {
  executions: ProjectExecution[];
};

export function ProjectExecutions({ executions }: ProjectExecutionsProps) {
  return (
    <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4 sm:p-5">
      <header className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Executions</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Latest OSA runs</p>
        </div>
        <Link href="/history" className="text-sm text-[var(--accent)] hover:underline">
          View history
        </Link>
      </header>

      {executions.length === 0 ? (
        <p className="text-sm text-[var(--text-secondary)]">No OSA executions for this project.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">
              <tr>
                <th className="pb-2 pr-4">Run</th>
                <th className="pb-2 pr-4">Status</th>
                <th className="pb-2 pr-4">Duration</th>
                <th className="pb-2 pr-4">Started</th>
                <th className="pb-2">Finished</th>
              </tr>
            </thead>
            <tbody>
              {executions.map((execution) => (
                <tr key={execution.id} className="border-t border-[var(--border-subtle)]">
                  <td className="py-3 pr-4">
                    <Link href={execution.href} className="font-medium text-[var(--accent)]">
                      {execution.label}
                    </Link>
                  </td>
                  <td className="py-3 pr-4 capitalize">{execution.status}</td>
                  <td className="py-3 pr-4">{execution.duration}</td>
                  <td className="py-3 pr-4">
                    {execution.startedAt ? formatProjectDate(execution.startedAt) : '—'}
                  </td>
                  <td className="py-3">
                    {execution.finishedAt ? formatProjectDate(execution.finishedAt) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
