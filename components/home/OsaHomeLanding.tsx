import Link from 'next/link';

import { OrbitMark } from '@/components/brand/OrbitMark';
import { HomeInvestorDemoAction } from '@/components/home/HomeInvestorDemoAction';
import { OsaEmptyState } from '@/components/osa/OsaEmptyState';
import type { ConciergeData } from '@/utils/home/concierge-mappers';
import { formatLandingStatLines } from '@/utils/home/home-landing-view';
import { OSA_EMPTY_STATES } from '@/utils/osa/empty-states';

type OsaHomeLandingProps = {
  data: ConciergeData;
};

export function OsaHomeLanding({ data }: OsaHomeLandingProps) {
  const stats = formatLandingStatLines(data.landing);

  return (
    <div className="mx-auto w-full max-w-[720px] px-2 pb-24 pt-8 sm:px-4 sm:pt-12">
      <header className="space-y-8">
        <div className="flex justify-start">
          <OrbitMark size="sm" className="text-[var(--accent)]" />
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <h1 className="text-[clamp(2.5rem,6vw,3.5rem)] font-medium leading-none tracking-[-0.04em] text-[var(--text-primary)]">
              OSA
            </h1>
            <p className="text-[15px] tracking-[0.02em] text-[var(--text-secondary)]">
              Executive Operating System
            </p>
          </div>

          <div className="space-y-1 text-[15px] leading-relaxed text-[var(--text-tertiary)]">
            <p>Не чат.</p>
            <p>Не менеджер задач.</p>
            <p>Не CRM.</p>
          </div>

          <p className="max-w-lg text-[17px] leading-[1.55] text-[var(--text-secondary)]">
            Операционная система для управления проектами и AI-командой.
          </p>
        </div>
      </header>

      <section className="mt-20 space-y-6">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
          Сегодня
        </p>

        <div className="space-y-2 text-[clamp(1.125rem,2vw,1.35rem)] leading-snug text-[var(--text-primary)]">
          <p>{stats.projects}</p>
          <p>{stats.tasks}</p>
          {stats.decisions ? <p>{stats.decisions}</p> : null}
        </div>

        <Link
          href={data.landing.nextStepHref}
          className="inline-flex items-center gap-2 text-[15px] font-medium text-[var(--accent)] transition hover:opacity-80"
        >
          <span>Следующий лучший шаг</span>
          <span aria-hidden="true">→</span>
        </Link>
        <p className="max-w-md text-[14px] leading-relaxed text-[var(--text-tertiary)]">
          {data.landing.nextStepLabel}
        </p>
      </section>

      <section className="mt-20 space-y-3">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
          <Link
            href={data.landing.continueHref ?? '/projects'}
            className="text-[15px] font-medium text-[var(--text-primary)] transition hover:text-[var(--accent)]"
          >
            {data.landing.continueLabel}
          </Link>

          <HomeInvestorDemoAction />

          <Link
            href="/projects"
            className="text-[15px] text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
          >
            Создать проект
          </Link>
        </div>
      </section>

      <section className="mt-24 space-y-6">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
          Последняя активность
        </p>

        {data.landing.recentActivity.length === 1 &&
        data.landing.recentActivity[0]?.id === 'empty' ? (
          <OsaEmptyState {...OSA_EMPTY_STATES.homeActivity} compact />
        ) : (
          <ul className="space-y-5">
            {data.landing.recentActivity.map((item) => (
              <li key={item.id}>
                {item.href ? (
                  <Link
                    href={item.href}
                    className="group block space-y-1 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                  >
                    <p className="text-[15px] font-medium text-[var(--text-primary)] transition group-hover:text-[var(--accent)]">
                      {item.label}
                    </p>
                    <p className="text-[14px] leading-relaxed text-[var(--text-secondary)]">{item.detail}</p>
                  </Link>
                ) : (
                  <div className="space-y-1">
                    <p className="text-[15px] font-medium text-[var(--text-primary)]">{item.label}</p>
                    <p className="text-[14px] leading-relaxed text-[var(--text-secondary)]">{item.detail}</p>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
