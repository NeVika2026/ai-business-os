import Link from 'next/link';

export type FactoryChainStage = 'find' | 'analyze' | 'create' | 'publish';

type FactoryChainBarProps = {
  active: FactoryChainStage;
};

const STAGES: Array<{
  id: FactoryChainStage;
  label: string;
  href: string;
}> = [
  { id: 'find', label: 'Найти', href: '/modules/find/studio' },
  { id: 'analyze', label: 'Анализ', href: '/modules/analyze/studio' },
  { id: 'create', label: 'Создать', href: '/modules/create/studio' },
  { id: 'publish', label: 'Опубликовать', href: '/modules/publish/studio' },
];

export function FactoryChainBar({ active }: FactoryChainBarProps) {
  return (
    <nav
      aria-label="Производственная цепочка"
      className="mb-5 overflow-hidden rounded-[24px] border border-white/[0.08] bg-[#070b11]/90 p-3"
    >
      <div className="flex flex-wrap items-center gap-2">
        {STAGES.map((stage, index) => {
          const isActive = stage.id === active;

          return (
            <div key={stage.id} className="flex items-center gap-2">
              <Link
                href={stage.href}
                aria-current={isActive ? 'step' : undefined}
                className={[
                  'rounded-2xl border px-3.5 py-2 text-[12px] font-black uppercase tracking-[.1em] transition',
                  isActive
                    ? 'border-[#f1c96c]/28 bg-[#f1c96c]/[0.08] text-[#f6dc8a]'
                    : 'border-white/[0.07] bg-white/[0.02] text-white/58 hover:border-[#69e4ee]/22 hover:text-white',
                ].join(' ')}
              >
                {String(index + 1).padStart(2, '0')} · {stage.label}
              </Link>
              {index < STAGES.length - 1 ? (
                <span aria-hidden="true" className="text-sm text-[#69e4ee]/45">
                  →
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
