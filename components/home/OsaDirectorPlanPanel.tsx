'use client';

import type { HomeDirectorPlanResult } from '@/utils/home/director-plan';

type ReadyPlan = Extract<HomeDirectorPlanResult, { status: 'ready' }>;

type OsaDirectorPlanPanelProps = {
  plan: ReadyPlan;
  disabled?: boolean;
  onStart: () => void;
  onBack: () => void;
};

export function OsaDirectorPlanPanel({
  plan,
  disabled = false,
  onStart,
  onBack,
}: OsaDirectorPlanPanelProps) {
  return (
    <section
      className="mx-auto mt-5 w-full max-w-3xl rounded-[26px] border border-black/[0.08] bg-white/85 p-5 shadow-[0_24px_70px_-50px_rgba(55,47,91,.5)] backdrop-blur-xl sm:p-6"
      aria-label="План OSA"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
            План перед запуском
          </p>
          <h2 className="mt-1 text-xl font-semibold text-[var(--text-primary)]">
            OSA поняла задачу и собрала команду
          </h2>
        </div>

        <div className="rounded-2xl bg-black/[0.04] px-4 py-2 text-right">
          <p className="text-[11px] uppercase tracking-[0.12em] text-black/35">
            Оценка
          </p>
          <p className="mt-0.5 text-sm font-semibold text-[var(--text-primary)]">
            {plan.estimatedTime}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[.9fr_1.1fr]">
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">Команда OSA</p>
          <div className="mt-3 grid gap-2">
            {plan.team.map((agent) => (
              <div
                key={agent.id}
                className="rounded-2xl border border-black/[0.06] bg-black/[0.025] px-4 py-3"
              >
                <p className="text-sm font-semibold text-[var(--text-primary)]">{agent.name}</p>
                <p className="mt-0.5 text-xs leading-5 text-[var(--text-secondary)]">
                  {agent.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">План работы</p>
          <ol className="mt-3 grid gap-2">
            {plan.stages.map((stage, index) => (
              <li
                key={stage.id}
                className="flex gap-3 rounded-2xl border border-black/[0.06] bg-white px-4 py-3"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-xs font-semibold text-[var(--accent)]">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{stage.title}</p>
                  <p className="mt-0.5 text-xs leading-5 text-[var(--text-secondary)]">
                    {stage.description}
                  </p>
                  <p className="mt-1 text-[11px] text-black/35">
                    {stage.estimatedMinutes} мин
                    {stage.agents.length ? ` · ${stage.agents.join(', ')}` : ''}
                    {stage.parallel ? ' · параллельно' : ''}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {plan.risks.length > 0 ? (
        <div className="mt-5 rounded-2xl border border-amber-500/20 bg-amber-50/70 px-4 py-3">
          <p className="text-sm font-semibold text-amber-900">Что OSA учтёт</p>
          <ul className="mt-2 grid gap-1.5 text-xs leading-5 text-amber-900/70">
            {plan.risks.map((risk) => (
              <li key={`${risk.severity}-${risk.title}`}>
                <strong>{risk.title}:</strong> {risk.description}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          disabled={disabled}
          onClick={onStart}
          className="inline-flex flex-1 items-center justify-center rounded-2xl bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-wait disabled:opacity-50"
        >
          {disabled ? 'Запускаю…' : 'Запустить план'}
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={onBack}
          className="inline-flex flex-1 items-center justify-center rounded-2xl border border-black/[0.08] bg-white px-5 py-3 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-black/[0.025] disabled:opacity-50"
        >
          Изменить задачу
        </button>
      </div>
    </section>
  );
}
