import Link from 'next/link';

import { OrbitMark } from '@/components/brand/OrbitMark';
import { HomeInvestorDemoAction } from '@/components/home/HomeInvestorDemoAction';
import { OsaEmptyState } from '@/components/osa/OsaEmptyState';
import { OSA_EMPTY_STATES } from '@/utils/osa/empty-states';
import type { MissionControlData } from '@/utils/mission-control/mission-control-types';

type MissionControlPageProps = {
  data: MissionControlData;
};

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
      {children}
    </p>
  );
}

export function MissionControlPage({ data }: MissionControlPageProps) {
  return (
    <div className="osa-mission-control mx-auto w-full max-w-[980px] px-2 pb-32 pt-8 sm:px-4 sm:pt-12">
      <header className="space-y-6">
        <div className="flex items-center gap-4">
          <OrbitMark size="sm" breathe className="text-[var(--accent)]" />
          <p className="text-[13px] tracking-[0.04em] text-[var(--text-secondary)]">{data.organizationName}</p>
        </div>

        <div className="space-y-3">
          <h1 className="text-[clamp(2.25rem,5vw,3.25rem)] font-medium leading-[1.05] tracking-[-0.04em] text-[var(--text-primary)]">
            Mission Control
          </h1>
          <p className="max-w-xl text-[16px] leading-relaxed text-[var(--text-secondary)]">
            Центр управления компанией — проекты, AI-команда и Executive Brain в одном месте.
          </p>
        </div>
      </header>

      <section className="mt-24 space-y-5">
        <SectionLabel>Today Focus</SectionLabel>
        <h2 className="max-w-3xl text-[clamp(1.5rem,3vw,2.125rem)] font-medium leading-[1.2] tracking-[-0.02em] text-[var(--text-primary)]">
          {data.todayFocus.headline}
        </h2>
        <p className="max-w-2xl text-[15px] leading-relaxed text-[var(--text-secondary)]">
          {data.todayFocus.context}
        </p>
      </section>

      <section className="mt-20 space-y-4">
        <SectionLabel>Next Best Action</SectionLabel>
        <Link
          href={data.nextBestAction.href}
          className="inline-flex items-center gap-2 text-[17px] font-medium text-[var(--accent)] transition hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
          <span>{data.nextBestAction.label}</span>
          <span aria-hidden="true">→</span>
        </Link>
        <p className="max-w-xl text-[14px] leading-relaxed text-[var(--text-tertiary)]">
          {data.nextBestAction.description}
        </p>
      </section>

      <div className="mt-28 grid gap-24 xl:grid-cols-[minmax(0,1fr)_240px] xl:gap-20">
        <div className="min-w-0 space-y-24">
          <section className="space-y-6">
            <SectionLabel>Active Projects</SectionLabel>
            {data.activeProjects.length === 0 ? (
              <OsaEmptyState {...OSA_EMPTY_STATES.homeActivity} compact />
            ) : (
              <ul className="space-y-5">
                {data.activeProjects.map((project) => (
                  <li key={project.id}>
                    <Link
                      href={project.href}
                      className="group block space-y-1 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                    >
                      <p className="text-[16px] font-medium text-[var(--text-primary)] transition group-hover:text-[var(--accent)]">
                        {project.name}
                      </p>
                      <p className="text-[14px] text-[var(--text-tertiary)]">{project.status}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="space-y-6">
            <SectionLabel>AI Orchestra</SectionLabel>
            {data.orchestra ? (
              <div className="space-y-6">
                <div className="flex flex-wrap items-baseline justify-between gap-4">
                  <Link
                    href={data.orchestra.projectHref}
                    className="text-[15px] font-medium text-[var(--text-primary)] transition hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                  >
                    {data.orchestra.projectName}
                  </Link>
                  <p className="text-[13px] tabular-nums text-[var(--text-tertiary)]">
                    {data.orchestra.overallProgress}% команды
                  </p>
                </div>
                {data.orchestra.activeActivity ? (
                  <p className="text-[15px] leading-relaxed text-[var(--text-secondary)]">
                    {data.orchestra.activeActivity}
                  </p>
                ) : null}
                {data.orchestra.agents.length > 0 ? (
                  <ul className="divide-y divide-[var(--border-subtle)]/60">
                    {data.orchestra.agents.map((agent) => (
                      <li key={`${agent.name}-${agent.role}`} className="flex items-start justify-between gap-6 py-4 first:pt-0">
                        <div className="min-w-0">
                          <p className="text-[15px] font-medium text-[var(--text-primary)]">{agent.name}</p>
                          <p className="mt-1 text-[13px] text-[var(--text-tertiary)]">{agent.role}</p>
                          <p className="mt-2 text-[14px] leading-relaxed text-[var(--text-secondary)]">
                            {agent.activity}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-[12px] font-medium text-[var(--accent)]">{agent.status}</p>
                          <p className="mt-1 text-[12px] tabular-nums text-[var(--text-tertiary)]">
                            {agent.progressPercent}%
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : (
              <OsaEmptyState {...OSA_EMPTY_STATES.orchestra} compact />
            )}
          </section>

          <section className="space-y-6">
            <SectionLabel>Deliverables</SectionLabel>
            {data.deliverables && data.deliverables.items.length > 0 ? (
              <div className="space-y-6">
                <div className="flex flex-wrap items-baseline justify-between gap-4">
                  <Link
                    href={data.deliverables.projectHref}
                    className="text-[15px] font-medium text-[var(--text-primary)] transition hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                  >
                    {data.deliverables.projectName}
                  </Link>
                  <p className="text-[13px] text-[var(--text-tertiary)]">
                    {data.deliverables.readyCount} ready
                  </p>
                </div>
                {data.deliverables.executiveSummary ? (
                  <p className="max-w-2xl text-[15px] leading-relaxed text-[var(--text-secondary)]">
                    {data.deliverables.executiveSummary}
                  </p>
                ) : null}
                <ul className="space-y-4">
                  {data.deliverables.items.map((item) => (
                    <li
                      key={item.title}
                      className="flex items-baseline justify-between gap-6 border-b border-[var(--border-subtle)]/50 pb-4 last:border-b-0"
                    >
                      <p className="text-[15px] text-[var(--text-primary)]">{item.title}</p>
                      <p className="shrink-0 text-[13px] font-medium text-[var(--text-tertiary)]">
                        {item.phaseLabel}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <OsaEmptyState {...OSA_EMPTY_STATES.deliverables} compact />
            )}
          </section>

          <section className="space-y-6">
            <SectionLabel>Executive Recommendations</SectionLabel>
            {data.recommendations.length > 0 ? (
              <ul className="space-y-4">
                {data.recommendations.map((item) => (
                  <li key={item} className="text-[15px] leading-relaxed text-[var(--text-secondary)]">
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[15px] leading-relaxed text-[var(--text-tertiary)]">
                Рекомендации появятся после первого Executive Review или решения Orchestra.
              </p>
            )}
          </section>
        </div>

        <aside className="space-y-6 xl:pt-1">
          <SectionLabel>Risks</SectionLabel>
          {data.risks.length > 0 ? (
            <ul className="space-y-4">
              {data.risks.map((item) => (
                <li key={item} className="text-[14px] leading-relaxed text-[var(--text-primary)]">
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[14px] leading-relaxed text-[var(--text-tertiary)]">
              Критических рисков не обнаружено.
            </p>
          )}
        </aside>
      </div>

      <section className="mt-28 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-[var(--border-subtle)]/60 pt-10">
        <Link
          href={data.continueHref}
          className="text-[15px] font-medium text-[var(--text-primary)] transition hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
          {data.continueLabel}
        </Link>
        <HomeInvestorDemoAction />
        <Link
          href="/projects"
          className="text-[15px] text-[var(--text-secondary)] transition hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
          Создать проект
        </Link>
      </section>
    </div>
  );
}
