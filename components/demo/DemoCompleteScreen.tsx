type DemoCompleteScreenProps = {
  projectTitle: string;
  onClose: () => void;
};

const COMPLETED_ITEMS = [
  'Проект создан',
  'План построен',
  'AI-команда запущена',
  'Решение принято',
  'История сохранена',
] as const;

export function DemoCompleteScreen({ projectTitle, onClose }: DemoCompleteScreenProps) {
  return (
    <div className="osa-demo-complete min-h-[calc(100vh-8rem)] bg-white px-4 pb-24 pt-10 sm:px-8">
      <div className="mx-auto max-w-[680px]">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
          Investor Demo
        </p>
        <h1 className="mt-4 text-[clamp(2rem,4vw,2.75rem)] font-medium leading-[1.1] tracking-[-0.03em] text-[var(--text-primary)]">
          Сегодня выполнено
        </h1>
        <p className="mt-4 text-[16px] leading-relaxed text-[var(--text-secondary)]">{projectTitle}</p>

        <ul className="mt-14 space-y-5">
          {COMPLETED_ITEMS.map((item) => (
            <li key={item} className="flex items-center gap-4 text-[18px] text-[var(--text-primary)]">
              <span className="text-[var(--accent)]" aria-hidden="true">
                ✔
              </span>
              {item}
            </li>
          ))}
        </ul>

        <section className="mt-16">
          <p className="text-[12px] font-medium uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
            Следующий лучший шаг
          </p>
          <p className="mt-4 text-[clamp(1.35rem,2.2vw,1.75rem)] font-medium leading-[1.3] tracking-[-0.02em] text-[var(--text-primary)]">
            Продолжить разработку проекта.
          </p>
        </section>

        <button
          type="button"
          onClick={onClose}
          className="mt-14 inline-flex rounded-full bg-[var(--accent)] px-7 py-3.5 text-[15px] font-medium text-white transition hover:opacity-90"
        >
          Вернуться в Workspace
        </button>
      </div>
    </div>
  );
}
