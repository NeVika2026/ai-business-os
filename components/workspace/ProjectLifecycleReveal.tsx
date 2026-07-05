'use client';

import { OrbitMark } from '@/components/brand/OrbitMark';
import type { ProjectLifecycleSnapshot } from '@/types/project-lifecycle';

type ProjectLifecycleRevealProps = {
  lifecycle: ProjectLifecycleSnapshot;
  isPending?: boolean;
  onContinue: () => void;
};

export function ProjectLifecycleReveal({
  lifecycle,
  isPending = false,
  onContinue,
}: ProjectLifecycleRevealProps) {
  return (
    <article className="osa-morning-briefing osa-exec-fade mx-auto w-full max-w-[720px] px-4 pb-20 pt-8 sm:px-6 sm:pt-12">
      <div className="flex justify-center">
        <OrbitMark size="md" breathe className="text-[var(--accent)] opacity-80" />
      </div>

      <header className="mt-12">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
          OSA организовала проект
        </p>
        <h1 className="mt-4 text-[clamp(2rem,4vw,2.75rem)] font-medium leading-[1.12] tracking-[-0.03em] text-[var(--text-primary)]">
          {lifecycle.projectName}
        </h1>
        <p className="mt-6 text-[17px] leading-[1.7] text-[var(--text-secondary)]">
          Тип проекта: {lifecycle.detectedTypeLabel}. Команда и план уже собраны — можно начинать без
          дополнительных вопросов.
        </p>
      </header>

      <section className="mt-14 border-t border-[var(--border-subtle)]/80 pt-10">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
          Команда
        </p>
        <ul className="mt-6 space-y-4">
          {lifecycle.specialists.map((member) => (
            <li key={member.role} className="flex items-baseline justify-between gap-6">
              <p className="text-[15px] font-medium text-[var(--text-primary)]">{member.role}</p>
              <p className="text-[14px] text-[var(--text-secondary)]">{member.status}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-14 border-t border-[var(--border-subtle)]/80 pt-10">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
          Рабочий план
        </p>
        <div className="mt-8 space-y-0">
          {lifecycle.workPlan.map((step, index) => (
            <section
              key={`${step.title}-${index}`}
              className="border-t border-[var(--border-subtle)]/70 py-8 first:border-t-0 first:pt-0"
            >
              <p className="text-[13px] tabular-nums tracking-[0.08em] text-[var(--text-tertiary)]">
                {index + 1}.
              </p>
              <h2 className="mt-3 text-[clamp(1.2rem,2vw,1.5rem)] font-medium leading-[1.35] tracking-[-0.02em] text-[var(--text-primary)]">
                {step.title}
              </h2>
              <div className="mt-4 space-y-1 text-[15px] text-[var(--text-secondary)]">
                <p>{step.estimate}</p>
                <p>{step.priorityLabel}</p>
              </div>
            </section>
          ))}
        </div>
      </section>

      <section className="mt-14 border-t border-[var(--border-subtle)]/80 pt-10">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
          Executive Brief
        </p>
        <p className="mt-6 whitespace-pre-line text-[15px] leading-[1.75] text-[var(--text-secondary)]">
          {lifecycle.executiveBrief}
        </p>
      </section>

      <footer className="mt-14 border-t border-[var(--border-subtle)]/80 pt-10">
        <button
          type="button"
          disabled={isPending}
          onClick={onContinue}
          className="inline-flex rounded-full bg-[var(--accent)] px-8 py-3.5 text-[15px] font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? 'OSA начинает первый шаг…' : 'Начать работу'}
        </button>
      </footer>
    </article>
  );
}
