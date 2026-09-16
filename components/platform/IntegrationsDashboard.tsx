import type {
  IntegrationCategory,
  IntegrationStatusView,
} from '@/utils/platform/integration-catalog';

type IntegrationsDashboardProps = {
  integrations: IntegrationStatusView[];
};

const CATEGORY_LABELS: Record<IntegrationCategory, string> = {
  infrastructure: 'Основа платформы',
  ai: 'AI-модели',
  media: 'Медиа и производство',
  publishing: 'Публикация и каналы',
  local: 'Локальные инструменты',
};

const STATUS_COPY = {
  connected: { label: 'Подключено', tone: 'text-emerald-200 bg-emerald-300/10' },
  missing: { label: 'Не подключено', tone: 'text-amber-200 bg-amber-300/10' },
  built_in: { label: 'Встроено', tone: 'text-sky-300 bg-sky-400/10' },
  planned: { label: 'Нужно подключить', tone: 'text-amber-200 bg-amber-300/10' },
} as const;

export function IntegrationsDashboard({
  integrations,
}: IntegrationsDashboardProps) {
  const connectedCount = integrations.filter(
    (item) => item.status === 'connected' || item.status === 'built_in',
  ).length;

  const categories = Object.keys(CATEGORY_LABELS) as IntegrationCategory[];

  return (
    <section className="mx-auto w-full max-w-6xl space-y-7 text-[#f7f2e8]">
      <div className="relative overflow-hidden rounded-[30px] border border-white/[0.09] bg-[radial-gradient(circle_at_top_right,rgba(105,228,238,.12),transparent_36%),radial-gradient(circle_at_left,rgba(241,201,108,.10),transparent_42%),linear-gradient(145deg,#06090e,#0b1018)] p-6 text-white sm:p-8">
        <p className="text-[12px] font-black uppercase tracking-[0.18em] text-[#79eaf2]">
          Бизнес Завод · Система
        </p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-[-.045em] sm:text-5xl">
              Интеграции
            </h1>
            <p className="mt-3 max-w-2xl text-lg leading-8 text-white/74">
              Здесь видно, какие движки и сервисы реально доступны платформе.
              Секретные ключи на этом экране никогда не показываются.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-right">
            <p className="text-2xl font-semibold">{connectedCount}</p>
            <p className="text-sm text-white/66">из {integrations.length} доступны</p>
          </div>
        </div>
      </div>

      {categories.map((category) => {
        const items = integrations.filter((item) => item.category === category);
        if (!items.length) return null;

        return (
          <div key={category}>
            <h2 className="mb-3 text-[12px] font-black uppercase tracking-[0.14em] text-[#f1c96c]">
              {CATEGORY_LABELS[category]}
            </h2>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {items.map((item) => {
                const status = STATUS_COPY[item.status];

                return (
                  <article
                    key={item.id}
                    className="rounded-[24px] border border-white/[0.08] bg-white/[0.025] p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-black text-[#fff8e7]">
                          {item.name}
                        </h3>
                        <p className="mt-1 text-sm leading-6 text-white/68">
                          {item.description}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${status.tone}`}
                      >
                        {status.label}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {item.capabilities.map((capability) => (
                        <span
                          key={capability}
                          className="rounded-full border border-white/[0.08] px-2.5 py-1 text-[12px] text-white/64"
                        >
                          {capability}
                        </span>
                      ))}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        );
      })}

      <div className="rounded-[24px] border border-white/[0.08] bg-white/[0.025] p-5 text-sm leading-6 text-white/68">
        <strong className="text-[#fff8e7]">Принцип платформы:</strong>{' '}
        в обычном режиме OSA сама выбирает доступный инструмент. Ручной выбор
        провайдера будет доступен в профессиональном режиме, но не перегружает
        основной интерфейс.
      </div>
    </section>
  );
}
