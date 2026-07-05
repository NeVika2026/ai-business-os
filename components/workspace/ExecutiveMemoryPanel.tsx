import { OsaEmptyState } from '@/components/osa/OsaEmptyState';
import { OSA_EMPTY_STATES } from '@/utils/osa/empty-states';
import type { ExecutiveMemory } from '@/utils/workspace/executive-memory';

type ExecutiveMemoryPanelProps = {
  memory: ExecutiveMemory;
  onClose: () => void;
};

export function ExecutiveMemoryPanel({ memory, onClose }: ExecutiveMemoryPanelProps) {
  return (
    <div className="osa-executive-memory min-h-[calc(100vh-8rem)] bg-white px-4 pb-24 pt-8 sm:px-8">
      <header className="mx-auto flex max-w-[680px] items-start justify-between gap-6">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
            Executive Memory
          </p>
          <h1 className="mt-3 text-[clamp(2rem,4vw,2.75rem)] font-medium leading-[1.1] tracking-[-0.03em] text-[var(--text-primary)]">
            {memory.projectTitle}
          </h1>
          <p className="mt-4 max-w-xl text-[16px] leading-relaxed text-[var(--text-secondary)]">
            Память решений проекта. Что решили, почему и что рекомендует система теперь.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-full px-4 py-2 text-[14px] text-[var(--text-secondary)] transition hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
          Закрыть
        </button>
      </header>

      <div className="osa-executive-memory-story mx-auto mt-20 max-w-[680px]">
        {memory.isEmpty ? (
          <OsaEmptyState {...OSA_EMPTY_STATES.executiveMemory} />
        ) : (
          <div className="space-y-20">
            {memory.entries.map((entry) => (
              <article key={entry.id} className="osa-memory-entry">
                <p className="text-[13px] uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
                  {entry.dateLabel}
                </p>
                <h2 className="mt-4 text-[clamp(1.5rem,2.5vw,2rem)] font-medium leading-[1.25] tracking-[-0.02em] text-[var(--text-primary)]">
                  {entry.title}
                </h2>

                <div className="mt-10 space-y-8">
                  <section>
                    <p className="text-[12px] font-medium uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                      Почему
                    </p>
                    <p className="mt-3 text-[16px] leading-[1.7] text-[var(--text-secondary)]">
                      {entry.reason}
                    </p>
                  </section>

                  <section>
                    <p className="text-[12px] font-medium uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                      Последствие
                    </p>
                    <p className="mt-3 text-[16px] leading-[1.7] text-[var(--text-secondary)]">
                      {entry.consequence}
                    </p>
                  </section>

                  <section>
                    <p className="text-[12px] font-medium uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                      Следующая рекомендация
                    </p>
                    <p className="mt-3 text-[16px] leading-[1.7] text-[var(--text-primary)]">
                      {entry.nextRecommendation}
                    </p>
                  </section>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
