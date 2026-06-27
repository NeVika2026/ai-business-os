import type { AgentRun } from '@/types/ai';
import { AGENT_RUN_STATUS_LABELS } from '@/types/ai';
import { formatDateTime } from '@/utils/ai/employees';

type EmployeeRunsProps = {
  runs: AgentRun[];
};

export function EmployeeRuns({ runs }: EmployeeRunsProps) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Последние Agent Runs</h2>
        <p className="text-sm text-[var(--text-secondary)]">Последние 10 запусков</p>
      </div>

      {runs.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-0)] px-4 py-8 text-center text-sm text-[var(--text-secondary)]">
          Запусков пока нет.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[var(--border-subtle)]">
          <table className="min-w-full divide-y divide-[var(--border-subtle)] text-sm">
            <thead className="bg-[var(--surface-1)]">
              <tr>
                {['Статус', 'Tokens In', 'Tokens Out', 'Начало', 'Завершение', 'Создан'].map(
                  (heading) => (
                    <th
                      key={heading}
                      scope="col"
                      className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]"
                    >
                      {heading}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)] bg-[var(--surface-0)]">
              {runs.map((run) => (
                <tr key={run.id} className="hover:bg-[var(--surface-1)]">
                  <td className="px-4 py-3 text-[var(--text-primary)]">
                    {AGENT_RUN_STATUS_LABELS[run.status]}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">
                    {run.tokens_input ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">
                    {run.tokens_output ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">
                    {formatDateTime(run.started_at)}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">
                    {formatDateTime(run.completed_at)}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">
                    {formatDateTime(run.created_at)}
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
