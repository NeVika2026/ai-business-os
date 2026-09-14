import { redirect } from 'next/navigation';

import { dispatchTask } from '@/app/(dashboard)/orchestrator/actions';
import { RunsTable } from '@/components/orchestrator/runs-table';
import { createClient } from '@/services/supabase/server';
import { getCurrentOrganizationId } from '@/utils/auth/organization';
import type { OrchestratorStats } from '@/types/orchestrator';
import {
  computeOrchestratorStats,
  mapOrchestratorRuns,
  RUN_SELECT,
} from '@/utils/orchestrator/runs';

const STAT_CARDS: { key: keyof OrchestratorStats; label: string }[] = [
  { key: 'totalRuns', label: 'Всего запусков' },
  { key: 'successfulRuns', label: 'Успешных' },
  { key: 'failedRuns', label: 'Ошибок' },
  { key: 'runningRuns', label: 'Выполняется' },
  { key: 'todayRuns', label: 'Сегодня' },
];

type OrchestratorPageProps = {
  searchParams: Promise<{ task?: string | string[] }>;
};

export default async function OrchestratorPage({ searchParams }: OrchestratorPageProps) {
  const params = await searchParams;
  const seededTask = Array.isArray(params.task) ? params.task[0] : params.task;
  const supabase = await createClient();
  const organizationId = await getCurrentOrganizationId(supabase);

  if (!organizationId) {
    redirect('/login');
  }

  const { data, error } = await supabase
    .from('agent_runs')
    .select(RUN_SELECT)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  const runs = mapOrchestratorRuns(data ?? []);
  const stats = computeOrchestratorStats(runs);
  const recentRuns = runs.slice(0, 10);

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[28px] border border-[var(--border-subtle)] bg-[var(--surface-1)] p-5 shadow-[var(--shadow-card)] lg:p-7">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent-cyan)]">
              Mission Control
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[var(--text-primary)] lg:text-5xl">
              Поставьте задачу. Оркестратор сам выберет исполнителя.
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--text-secondary)]">
              Бизнес-Завод анализирует формулировку, выбирает активного AI-сотрудника по роли,
              передаёт задачу в runtime и сохраняет запуск в общей истории.
            </p>
          </div>
          <div className="rounded-full border border-[var(--border-subtle)] px-4 py-2 text-xs text-[var(--text-secondary)]">
            <span className="mr-2 inline-block h-2 w-2 rounded-full bg-[var(--success)] shadow-[0_0_12px_var(--success)]" />
            Автомаршрутизация включена
          </div>
        </div>

        <form action={dispatchTask} className="mt-6 grid gap-3 lg:grid-cols-[1fr_auto]">
          <textarea
            name="task"
            required
            maxLength={4000}
            defaultValue={seededTask ?? ''}
            rows={3}
            placeholder="Например: найди слабое место в продажах, предложи план и подготовь сообщение клиентам"
            className="min-h-28 resize-y rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-0)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--accent-cyan)]"
          />
          <button
            type="submit"
            className="liquid-button self-stretch px-6 lg:min-w-48"
          >
            Запустить завод →
          </button>
        </form>
        {seededTask ? (
          <p className="mt-3 text-xs text-[var(--text-tertiary)]">
            Задача перенесена с предыдущего экрана. Можно отредактировать перед запуском.
          </p>
        ) : null}
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {STAT_CARDS.map((card) => (
          <article
            key={card.key}
            className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4"
          >
            <p className="text-sm text-[var(--text-secondary)]">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">
              {stats[card.key]}
            </p>
          </article>
        ))}
      </div>

      <RunsTable
        runs={recentRuns}
        title="Последние запуски"
        description="Последние 10 задач Бизнес-Завода"
        showViewAll
      />
    </div>
  );
}
