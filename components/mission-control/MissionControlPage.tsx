import Link from 'next/link';

import { HomeInvestorDemoAction } from '@/components/home/HomeInvestorDemoAction';
import { OsaEmptyState } from '@/components/osa/OsaEmptyState';
import { OSA_EMPTY_STATES } from '@/utils/osa/empty-states';
import type { MissionControlData } from '@/utils/mission-control/mission-control-types';
import type { ExecutiveAttentionPriority } from '@/types/executive-attention';

type MissionControlPageProps = {
  data: MissionControlData;
};

function priorityLabel(priority: ExecutiveAttentionPriority): string {
  switch (priority) {
    case 'high':
      return 'Критично';
    case 'medium':
      return 'Важно';
    case 'low':
      return 'Наблюдать';
  }
}

function priorityTone(priority: ExecutiveAttentionPriority): string {
  switch (priority) {
    case 'high':
      return 'border-red-400/20 bg-red-400/[0.06] text-red-200';
    case 'medium':
      return 'border-amber-300/20 bg-amber-300/[0.06] text-amber-100';
    case 'low':
      return 'border-white/10 bg-white/[0.035] text-white/45';
  }
}

function progressWidth(value: number): string {
  return `${Math.min(100, Math.max(0, Math.round(value)))}%`;
}

export function MissionControlPage({ data }: MissionControlPageProps) {
  const orchestraProgress = data.orchestra?.overallProgress ?? 0;
  const readyDeliverables = data.deliverables?.readyCount ?? 0;
  const activeAgents = data.orchestra?.agents.filter((agent) => agent.progressPercent < 100).length ?? 0;

  const stats = [
    {
      label: 'Активные проекты',
      value: data.activeProjects.length,
      hint: 'рабочих пространств',
      tone: 'text-[#f2c864]',
    },
    {
      label: 'AI-команда',
      value: data.orchestra ? `${orchestraProgress}%` : '—',
      hint: data.orchestra ? `${activeAgents} в работе` : 'нет активного запуска',
      tone: 'text-[#72e4ee]',
    },
    {
      label: 'Готово',
      value: readyDeliverables,
      hint: 'результатов',
      tone: 'text-emerald-200',
    },
    {
      label: 'Требует внимания',
      value: data.attentionRequired.length,
      hint: data.attentionRequired.length === 0 ? 'всё штатно' : 'сигналов',
      tone: data.attentionRequired.length > 0 ? 'text-amber-200' : 'text-white/70',
    },
  ];

  return (
    <main className="relative min-h-full overflow-hidden bg-[#06080c] text-[#f7f2e8]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.022)_1px,transparent_1px)] [background-size:46px_46px] [mask-image:linear-gradient(to_bottom,transparent,#000_10%,#000_85%,transparent)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 -top-32 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgba(231,185,82,.13),transparent_68%)] blur-2xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-[35%] top-20 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(88,219,232,.08),transparent_70%)] blur-3xl"
      />

      <div className="relative z-[1] mx-auto w-full max-w-[1320px] px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pt-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-[#e7b952]">
              Бизнес-Завод · Mission Control
            </p>
            <p className="mt-1 text-xs text-white/35">{data.organizationName}</p>
          </div>
          <Link
            href="/home"
            className="rounded-full border border-white/[0.08] bg-white/[0.025] px-4 py-2 text-xs font-semibold text-white/55 transition hover:border-[#e7b952]/25 hover:text-[#f3cf73]"
          >
            ← На главный экран
          </Link>
        </header>

        <section className="mt-8 grid gap-4 xl:grid-cols-[1.15fr_.85fr]">
          <div className="relative overflow-hidden rounded-[32px] border border-white/[0.08] bg-[linear-gradient(145deg,rgba(255,255,255,.055),rgba(255,255,255,.018))] p-6 shadow-[0_32px_100px_-58px_rgba(0,0,0,.9)] backdrop-blur-2xl sm:p-8">
            <div
              aria-hidden="true"
              className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(231,185,82,.14),transparent_68%)]"
            />
            <p className="relative text-[10px] font-bold uppercase tracking-[0.2em] text-[#58dbe8]">
              Фокус директора
            </p>
            <h1 className="relative mt-4 max-w-4xl text-[clamp(2.15rem,5vw,4.8rem)] font-semibold leading-[.98] tracking-[-0.06em] text-[#fff8e7]">
              {data.todayFocus.headline}
            </h1>
            <p className="relative mt-5 max-w-3xl text-sm leading-6 text-white/48 sm:text-base sm:leading-7">
              {data.todayFocus.context}
            </p>

            <div className="relative mt-7 rounded-[22px] border border-[#e7b952]/15 bg-black/20 p-4 sm:p-5">
              <p className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-[#e7b952]">
                Следующее лучшее действие
              </p>
              <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
                <div className="max-w-2xl">
                  <p className="text-lg font-semibold text-[#fff8e7]">
                    {data.nextBestAction.label}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-white/40">
                    {data.nextBestAction.description}
                  </p>
                </div>
                <Link
                  href={data.nextBestAction.href}
                  className="inline-flex shrink-0 items-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#f2d474,#c68a26)] px-5 py-3 text-sm font-extrabold text-[#181006] shadow-[0_14px_34px_-18px_rgba(231,185,82,.85)] transition hover:-translate-y-0.5 hover:brightness-110"
                >
                  Выполнить <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          </div>

          <aside className="rounded-[32px] border border-white/[0.08] bg-[#090d14]/78 p-5 backdrop-blur-xl sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#58dbe8]">
                  Состояние завода
                </p>
                <h2 className="mt-2 text-xl font-semibold tracking-[-0.04em] text-[#fff8e7]">
                  Система в реальном времени
                </h2>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/15 bg-emerald-300/[0.06] px-3 py-1.5 text-[9px] font-bold text-emerald-200">
                <i className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(110,231,150,.9)]" />
                ONLINE
              </span>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              {stats.map((item) => (
                <div
                  key={item.label}
                  className="rounded-[20px] border border-white/[0.065] bg-white/[0.025] p-4"
                >
                  <p className="text-[10px] leading-4 text-white/35">{item.label}</p>
                  <p className={`mt-2 text-2xl font-semibold tracking-[-0.04em] ${item.tone}`}>
                    {item.value}
                  </p>
                  <p className="mt-1 text-[10px] text-white/25">{item.hint}</p>
                </div>
              ))}
            </div>

            {data.orchestra ? (
              <div className="mt-4 rounded-[20px] border border-[#58dbe8]/10 bg-[#58dbe8]/[0.035] p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-[#dffbff]">
                      {data.orchestra.projectName}
                    </p>
                    <p className="mt-1 truncate text-[10px] text-white/32">
                      {data.orchestra.activeActivity ?? 'AI-команда выполняет план'}
                    </p>
                  </div>
                  <strong className="shrink-0 text-sm text-[#72e4ee]">{orchestraProgress}%</strong>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                  <i
                    className="block h-full rounded-full bg-[linear-gradient(90deg,#58dbe8,#e7b952)] shadow-[0_0_14px_rgba(88,219,232,.3)] transition-all"
                    style={{ width: progressWidth(orchestraProgress) }}
                  />
                </div>
              </div>
            ) : null}
          </aside>
        </section>

        {data.attentionRequired.length > 0 ? (
          <section className="mt-5 rounded-[28px] border border-amber-300/15 bg-amber-300/[0.035] p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-amber-200">
                  Требует внимания
                </p>
                <h2 className="mt-2 text-xl font-semibold tracking-[-0.04em] text-[#fff8e7]">
                  Executive Brain нашёл отклонения
                </h2>
              </div>
              <span className="rounded-full border border-amber-300/15 px-3 py-1.5 text-[10px] font-bold text-amber-100">
                {data.attentionRequired.length} сигналов
              </span>
            </div>

            <div className="mt-5 grid gap-3 lg:grid-cols-2">
              {data.attentionRequired.map((item) => (
                <article
                  key={item.id}
                  className="rounded-[20px] border border-white/[0.07] bg-black/20 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    {item.href ? (
                      <Link
                        href={item.href}
                        className="text-sm font-semibold text-[#fff8e7] transition hover:text-[#f1ca68]"
                      >
                        {item.title}
                      </Link>
                    ) : (
                      <p className="text-sm font-semibold text-[#fff8e7]">{item.title}</p>
                    )}
                    <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-bold ${priorityTone(item.priority)}`}>
                      {priorityLabel(item.priority)}
                    </span>
                  </div>
                  <p className="mt-3 text-xs leading-5 text-white/45">{item.cause}</p>
                  <p className="mt-3 text-xs leading-5 text-white/30">
                    <span className="text-white/55">Действие:</span> {item.recommendation}
                  </p>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-5 grid gap-4 xl:grid-cols-[1.08fr_.92fr]">
          <div className="space-y-4">
            <article className="rounded-[28px] border border-white/[0.08] bg-white/[0.025] p-5 sm:p-6">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#e7b952]">
                    Рабочие пространства
                  </p>
                  <h2 className="mt-2 text-xl font-semibold tracking-[-0.04em] text-[#fff8e7]">
                    Активные проекты
                  </h2>
                </div>
                <Link href="/projects" className="text-xs font-semibold text-[#72e4ee] hover:text-white">
                  Все проекты ↗
                </Link>
              </div>

              {data.activeProjects.length === 0 ? (
                <div className="mt-5">
                  <OsaEmptyState {...OSA_EMPTY_STATES.homeActivity} compact />
                </div>
              ) : (
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {data.activeProjects.map((project, index) => (
                    <Link
                      key={project.id}
                      href={project.href}
                      className="group rounded-[20px] border border-white/[0.065] bg-black/15 p-4 transition hover:border-[#e7b952]/22 hover:bg-white/[0.03]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-[9px] font-bold tracking-[0.15em] text-[#e7b952]/65">
                          PROJECT {String(index + 1).padStart(2, '0')}
                        </span>
                        <span className="h-2 w-2 rounded-full bg-emerald-300/75 shadow-[0_0_10px_rgba(110,231,150,.35)]" />
                      </div>
                      <p className="mt-3 text-sm font-semibold text-[#fff8e7] transition group-hover:text-[#f2cf78]">
                        {project.name}
                      </p>
                      <p className="mt-1 text-[10px] text-white/30">{project.status}</p>
                    </Link>
                  ))}
                </div>
              )}
            </article>

            <article className="rounded-[28px] border border-white/[0.08] bg-white/[0.025] p-5 sm:p-6">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#58dbe8]">
                    AI Orchestra
                  </p>
                  <h2 className="mt-2 text-xl font-semibold tracking-[-0.04em] text-[#fff8e7]">
                    Кто сейчас на смене
                  </h2>
                </div>
                {data.orchestra ? (
                  <Link
                    href={data.orchestra.projectHref}
                    className="text-xs font-semibold text-[#72e4ee] hover:text-white"
                  >
                    Открыть workspace ↗
                  </Link>
                ) : null}
              </div>

              {data.orchestra ? (
                <div className="mt-5 space-y-3">
                  {data.orchestra.agents.length > 0 ? (
                    data.orchestra.agents.map((agent) => (
                      <div
                        key={`${agent.name}-${agent.role}`}
                        className="rounded-[20px] border border-white/[0.065] bg-black/15 p-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[#fff8e7]">{agent.name}</p>
                            <p className="mt-1 text-[10px] text-white/32">{agent.role}</p>
                          </div>
                          <span className="shrink-0 rounded-full border border-[#58dbe8]/12 bg-[#58dbe8]/[0.045] px-2.5 py-1 text-[9px] font-bold text-[#8ceaf2]">
                            {agent.status}
                          </span>
                        </div>
                        <p className="mt-3 text-xs leading-5 text-white/42">{agent.activity}</p>
                        <div className="mt-3 flex items-center gap-3">
                          <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                            <i
                              className="block h-full rounded-full bg-[linear-gradient(90deg,#58dbe8,#e7b952)]"
                              style={{ width: progressWidth(agent.progressPercent) }}
                            />
                          </div>
                          <span className="text-[9px] font-bold tabular-nums text-white/36">
                            {agent.progressPercent}%
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm leading-6 text-white/35">
                      {data.orchestra.activeActivity ?? 'Оркестратор подготавливает команду.'}
                    </p>
                  )}
                </div>
              ) : (
                <div className="mt-5">
                  <OsaEmptyState {...OSA_EMPTY_STATES.orchestra} compact />
                </div>
              )}
            </article>
          </div>

          <div className="space-y-4">
            <article className="rounded-[28px] border border-white/[0.08] bg-white/[0.025] p-5 sm:p-6">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#e7b952]">
                    Результаты производства
                  </p>
                  <h2 className="mt-2 text-xl font-semibold tracking-[-0.04em] text-[#fff8e7]">
                    Deliverables
                  </h2>
                </div>
                {data.deliverables ? (
                  <span className="text-xs font-semibold text-emerald-200">
                    {data.deliverables.readyCount} ready
                  </span>
                ) : null}
              </div>

              {data.deliverables && data.deliverables.items.length > 0 ? (
                <div className="mt-5">
                  {data.deliverables.executiveSummary ? (
                    <p className="mb-4 text-xs leading-5 text-white/40">
                      {data.deliverables.executiveSummary}
                    </p>
                  ) : null}
                  <div className="grid gap-2">
                    {data.deliverables.items.map((item) => (
                      <div
                        key={item.title}
                        className="flex items-center justify-between gap-4 rounded-2xl border border-white/[0.055] bg-black/15 px-4 py-3"
                      >
                        <p className="min-w-0 truncate text-xs font-semibold text-[#fff8e7]">
                          {item.title}
                        </p>
                        <span className="shrink-0 text-[9px] font-bold uppercase tracking-[0.12em] text-emerald-200/75">
                          {item.phaseLabel}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mt-5">
                  <OsaEmptyState {...OSA_EMPTY_STATES.deliverables} compact />
                </div>
              )}
            </article>

            <article className="rounded-[28px] border border-[#58dbe8]/10 bg-[linear-gradient(145deg,rgba(88,219,232,.04),rgba(231,185,82,.025))] p-5 sm:p-6">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#58dbe8]">
                Executive Brain
              </p>
              <h2 className="mt-2 text-xl font-semibold tracking-[-0.04em] text-[#fff8e7]">
                Рекомендации
              </h2>

              {data.recommendations.length > 0 ? (
                <ol className="mt-5 grid gap-3">
                  {data.recommendations.map((item, index) => (
                    <li key={item} className="flex gap-3 rounded-2xl border border-white/[0.055] bg-black/15 p-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#e7b952]/20 text-[9px] font-bold text-[#e7b952]">
                        {index + 1}
                      </span>
                      <p className="text-xs leading-5 text-white/46">{item}</p>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="mt-4 text-sm leading-6 text-white/34">
                  Рекомендации появятся после первого Executive Review.
                </p>
              )}
            </article>

            <article className="rounded-[28px] border border-white/[0.08] bg-white/[0.025] p-5 sm:p-6">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/35">
                Риски
              </p>
              {data.risks.length > 0 ? (
                <ul className="mt-4 grid gap-2">
                  {data.risks.map((item) => (
                    <li
                      key={item}
                      className="rounded-2xl border border-red-300/10 bg-red-300/[0.025] px-4 py-3 text-xs leading-5 text-white/42"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-emerald-200/55">Критических рисков не обнаружено.</p>
              )}
            </article>
          </div>
        </section>

        <footer className="mt-5 flex flex-wrap items-center gap-3 rounded-[24px] border border-white/[0.07] bg-white/[0.02] p-4">
          <Link
            href={data.continueHref}
            className="rounded-2xl bg-white/[0.06] px-4 py-2.5 text-xs font-semibold text-[#fff8e7] transition hover:bg-white/[0.09]"
          >
            {data.continueLabel} →
          </Link>
          <Link
            href="/projects"
            className="rounded-2xl border border-white/[0.07] px-4 py-2.5 text-xs font-semibold text-white/45 transition hover:text-white"
          >
            Создать проект
          </Link>
          <div className="ml-auto">
            <HomeInvestorDemoAction />
          </div>
        </footer>
      </div>
    </main>
  );
}
