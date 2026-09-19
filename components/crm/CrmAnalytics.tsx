import Link from 'next/link';

type FunnelRow = {
  label: string;
  value: number;
  percent: number;
  tone: string;
};

type SourceRow = {
  source: string;
  total: number;
  qualified: number;
  won: number;
};

type CrmAnalyticsProps = {
  metrics: {
    total: number;
    new: number;
    contacted: number;
    qualified: number;
    won: number;
    lost: number;
    waitingReply: number;
    overdue: number;
    contacts7d: number;
  };
  funnel: FunnelRow[];
  sources: SourceRow[];
};

function metricCard(label: string, value: number, note: string, tone: string) {
  return (
    <div className={"rounded-[22px] border p-5 " + tone}>
      <p className="text-[10px] font-black uppercase tracking-[.11em] text-white/38">{label}</p>
      <p className="mt-2 text-4xl font-black tracking-[-.05em] text-[#fff8e7]">{value}</p>
      <p className="mt-2 text-xs leading-5 text-white/42">{note}</p>
    </div>
  );
}

export function CrmAnalytics({ metrics, funnel, sources }: CrmAnalyticsProps) {
  const conversion = metrics.total > 0 ? Math.round((metrics.won / metrics.total) * 100) : 0;
  const engagement = metrics.total > 0
    ? Math.round(((metrics.contacted + metrics.qualified + metrics.won) / metrics.total) * 100)
    : 0;

  return (
    <main className="relative mx-auto w-full max-w-[1380px] overflow-hidden pb-16 text-[#f7f2e8]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 top-0 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(105,228,238,.10),transparent_70%)] blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-[18%] top-24 h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle,rgba(241,201,108,.08),transparent_70%)] blur-3xl"
      />

      <section className="relative overflow-hidden rounded-[34px] border border-white/[0.09] bg-[linear-gradient(145deg,#06090e,#0b1119_56%,#06080c)] p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <div className="flex items-center gap-3">
              <Link href="/crm" className="text-sm font-bold text-white/50 hover:text-white">
                ← CRM
              </Link>
              <span className="text-white/18">/</span>
              <p className="text-[12px] font-black uppercase tracking-[.16em] text-[#79eaf2]">
                АНАЛИТИКА
              </p>
            </div>
            <h1 className="mt-5 max-w-4xl text-[clamp(3rem,5vw,5.4rem)] font-black leading-[.92] tracking-[-.06em] text-[#fff8e7]">
              Воронка продаж
              <span className="block bg-[linear-gradient(180deg,#fff0ad,#d99a2d)] bg-clip-text text-transparent">
                без догадок.
              </span>
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-white/68">
              Сколько лидов пришло, сколько уже в работе, где застряли и какие источники реально дают движение к сделке.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/crm/export"
              className="rounded-[16px] border border-white/[0.09] bg-white/[0.025] px-5 py-3 text-sm font-black text-white/66"
            >
              Экспорт CSV
            </Link>
            <Link
              href="/crm/inbox"
              className="rounded-[16px] border border-emerald-300/14 bg-emerald-300/[0.04] px-5 py-3 text-sm font-black text-emerald-200"
            >
              Рабочий стол →
            </Link>
            <Link
              href="/modules/communicate/studio"
              className="rounded-[16px] border border-[#69e4ee]/16 bg-[#69e4ee]/[0.04] px-5 py-3 text-sm font-black text-[#bff8fb]"
            >
              Найти лидов →
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {metricCard('Все лиды', metrics.total, 'Вся база CRM', 'border-white/[0.08] bg-black/20')}
          {metricCard('В контакте', metrics.contacted + metrics.qualified + metrics.won, engagement + '% базы уже в диалоге', 'border-[#69e4ee]/12 bg-[#69e4ee]/[0.03]')}
          {metricCard('Сделки', metrics.won, conversion + '% конверсия от всей базы', 'border-emerald-300/12 bg-emerald-300/[0.03]')}
          {metricCard('Требуют внимания', metrics.waitingReply + metrics.overdue, metrics.waitingReply + ' ждут ответа · ' + metrics.overdue + ' просрочено', 'border-[#f1c96c]/12 bg-[#f1c96c]/[0.03]')}
        </div>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
        <div className="rounded-[30px] border border-white/[0.08] bg-[#080c12] p-5 sm:p-6">
          <p className="text-[11px] font-black uppercase tracking-[.14em] text-[#79eaf2]">ВОРОНКА</p>
          <h2 className="mt-2 text-2xl font-black tracking-[-.035em] text-[#fff8e7]">
            Где находятся лиды
          </h2>

          <div className="mt-6 grid gap-4">
            {funnel.map((row) => (
              <div key={row.label}>
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-[#fff8e7]">{row.label}</p>
                    <p className="mt-1 text-[11px] text-white/36">{row.percent}% от всей базы</p>
                  </div>
                  <p className="text-2xl font-black tracking-[-.04em] text-white/82">{row.value}</p>
                </div>
                <div className="mt-2 h-3 overflow-hidden rounded-full border border-white/[0.06] bg-black/30">
                  <div
                    className={"h-full rounded-full " + row.tone}
                    style={{ width: Math.max(row.percent, row.value > 0 ? 3 : 0) + '%' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid content-start gap-5">
          <div className="rounded-[30px] border border-white/[0.08] bg-[#080c12] p-5 sm:p-6">
            <p className="text-[11px] font-black uppercase tracking-[.14em] text-[#f4d878]">РАБОТА СЕЙЧАС</p>
            <h2 className="mt-2 text-2xl font-black tracking-[-.035em] text-[#fff8e7]">Что происходит</h2>

            <div className="mt-5 grid gap-3">
              <SmallStat label="Новые лиды" value={metrics.new} />
              <SmallStat label="Ждут вашего ответа" value={metrics.waitingReply} />
              <SmallStat label="Просроченные касания" value={metrics.overdue} />
              <SmallStat label="Контактов за 7 дней" value={metrics.contacts7d} />
              <SmallStat label="Отказов" value={metrics.lost} />
            </div>
          </div>

          <div className="rounded-[30px] border border-violet-300/12 bg-[radial-gradient(circle_at_top_right,rgba(167,139,250,.08),transparent_42%),#080c12] p-5 sm:p-6">
            <p className="text-[11px] font-black uppercase tracking-[.14em] text-violet-200">СИГНАЛ</p>
            <p className="mt-3 text-sm leading-6 text-white/60">
              {metrics.waitingReply > 0
                ? 'Есть клиенты, которые уже ответили. Они приоритетнее холодного поиска новых лидов.'
                : metrics.overdue > 0
                  ? 'Новых ответов нет, но есть просроченные follow-up. Их лучше разобрать до следующего поиска.'
                  : 'Входящие и follow-up сейчас чистые. Можно наращивать верх воронки через Scout.'}
            </p>
            <Link
              href={metrics.waitingReply + metrics.overdue > 0 ? '/crm/inbox' : '/modules/communicate/studio'}
              className="mt-4 inline-flex rounded-[14px] border border-violet-300/16 bg-violet-300/[0.04] px-4 py-2.5 text-xs font-black text-violet-100"
            >
              {metrics.waitingReply + metrics.overdue > 0 ? 'Разобрать работу →' : 'Найти новые лиды →'}
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-5 rounded-[30px] border border-white/[0.08] bg-[#080c12] p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[.14em] text-[#79eaf2]">ИСТОЧНИКИ</p>
            <h2 className="mt-2 text-2xl font-black tracking-[-.035em] text-[#fff8e7]">
              Откуда приходят лиды
            </h2>
          </div>
          <p className="text-xs text-white/32">показываются источники с реальными лидами</p>
        </div>

        <div className="mt-5 overflow-x-auto">
          <div className="min-w-[720px]">
            <div className="grid grid-cols-[1fr_130px_130px_130px] gap-3 border-b border-white/[0.06] px-3 py-2 text-[10px] font-black uppercase tracking-[.10em] text-white/30">
              <span>Источник</span>
              <span className="text-right">Лиды</span>
              <span className="text-right">Интерес</span>
              <span className="text-right">Сделки</span>
            </div>

            <div className="grid gap-1 pt-2">
              {sources.length ? (
                sources.map((row) => (
                  <div
                    key={row.source}
                    className="grid grid-cols-[1fr_130px_130px_130px] gap-3 rounded-[16px] border border-white/[0.06] bg-white/[0.015] px-3 py-3 text-sm"
                  >
                    <span className="font-black text-[#fff8e7]">{row.source}</span>
                    <span className="text-right font-bold text-white/64">{row.total}</span>
                    <span className="text-right font-bold text-violet-200">{row.qualified}</span>
                    <span className="text-right font-bold text-emerald-200">{row.won}</span>
                  </div>
                ))
              ) : (
                <div className="rounded-[18px] border border-dashed border-white/[0.08] p-7 text-center text-sm text-white/34">
                  Источники появятся после первых лидов.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function SmallStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[16px] border border-white/[0.06] bg-white/[0.018] px-4 py-3">
      <span className="text-sm text-white/52">{label}</span>
      <span className="text-lg font-black text-[#fff8e7]">{value}</span>
    </div>
  );
}
