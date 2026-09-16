'use client';

import { useState, useTransition } from 'react';

import {
  runResearchAction,
  type ResearchMode,
  type ResearchSource,
} from '@/app/(dashboard)/modules/research/actions';

type ResearchStudioProps = {
  mode: ResearchMode;
  initialQuery?: string;
};

export function ResearchStudio({ mode, initialQuery = '' }: ResearchStudioProps) {
  const [query, setQuery] = useState(initialQuery);
  const [summary, setSummary] = useState('');
  const [sources, setSources] = useState<ResearchSource[]>([]);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  const isFind = mode === 'find';

  const runResearch = () => {
    const trimmed = query.trim();
    if (!trimmed || isPending) return;

    setError('');
    setSummary('');
    setSources([]);

    startTransition(async () => {
      const result = await runResearchAction({ mode, query: trimmed });

      if (result.status === 'failed') {
        setError(result.message);
        setSources(result.sources ?? []);
        return;
      }

      setSummary(result.summary);
      setSources(result.sources);
    });
  };

  return (
    <main className="relative mx-auto w-full max-w-[1320px] overflow-hidden pb-16 text-[#f7f2e8]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 top-0 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(105,228,238,.10),transparent_70%)] blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-[18%] top-32 h-[340px] w-[340px] rounded-full bg-[radial-gradient(circle,rgba(241,201,108,.09),transparent_70%)] blur-3xl"
      />

      <section className="relative overflow-hidden rounded-[34px] border border-white/[0.09] bg-[linear-gradient(145deg,#06090e,#0b1119_56%,#06080c)] p-6 sm:p-8">
        <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.025)_1px,transparent_1px)] [background-size:42px_42px]" />
        <div className="relative">
          <p className="text-[13px] font-black uppercase tracking-[.18em] text-[#79eaf2]">
            БИЗНЕС ЗАВОД · {isFind ? 'ЦЕХ ПОИСКА' : 'ЦЕХ АНАЛИТИКИ'}
          </p>
          <h1 className="mt-4 max-w-4xl text-[clamp(2.8rem,5vw,5.3rem)] font-black leading-[.95] tracking-[-.06em] text-[#fff8e7]">
            {isFind ? 'Искать в интернете.' : 'Разобрать по фактам.'}
            <span className="block bg-[linear-gradient(180deg,#fff0ad,#d99a2d)] bg-clip-text text-transparent">
              Не наугад.
            </span>
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-white/74">
            {isFind
              ? 'OSA ищет актуальные источники, а затем собирает из них конкретные находки и следующий шаг.'
              : 'OSA сначала получает актуальные источники, потом отделяет факты от выводов и собирает рабочий анализ.'}
          </p>
        </div>
      </section>

      <section className="relative mt-5 grid gap-5 xl:grid-cols-[.72fr_1.28fr]">
        <div className="rounded-[30px] border border-white/[0.08] bg-[#080c12] p-5 sm:p-6">
          <p className="text-[12px] font-black uppercase tracking-[.14em] text-[#f1c96c]">
            ЗАПРОС
          </p>
          <textarea
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            rows={8}
            placeholder={
              isFind
                ? 'Например: найди компании в Екатеринбурге, которым может быть нужна автоматизация отдела продаж…'
                : 'Например: сравни предложения трёх конкурентов и покажи, чем можно отстроиться…'
            }
            className="mt-4 w-full resize-none rounded-[22px] border border-white/[0.09] bg-black/25 px-4 py-4 text-base leading-7 text-white outline-none placeholder:text-white/42 focus:border-[#69e4ee]/28"
          />

          <button
            type="button"
            onClick={runResearch}
            disabled={!query.trim() || isPending}
            className="mt-4 w-full rounded-[18px] bg-[linear-gradient(135deg,#ffe08a,#d79a30)] px-5 py-4 text-sm font-black text-[#1b1105] shadow-[0_18px_40px_-22px_rgba(241,201,108,.6)] transition hover:-translate-y-0.5 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-35"
          >
            {isPending
              ? 'OSA ищет и проверяет источники…'
              : isFind
                ? 'Запустить поиск →'
                : 'Запустить анализ →'}
          </button>

          {error ? (
            <p className="mt-4 rounded-2xl border border-red-300/10 bg-red-300/[0.04] px-4 py-3 text-sm leading-6 text-red-100/80">
              {error}
            </p>
          ) : null}

          <div className="mt-5 rounded-[20px] border border-white/[0.07] bg-white/[0.02] p-4">
            <p className="text-[12px] font-black uppercase tracking-[.12em] text-[#79eaf2]">
              ПОИСКОВЫЙ ДВИЖОК
            </p>
            <p className="mt-2 text-sm leading-6 text-white/62">
              Для живого веб-поиска требуется подключённый Brave Search API. Если он не настроен,
              цех честно покажет, что поиск недоступен, а не подставит фиктивные ссылки.
            </p>
          </div>
        </div>

        <div className="rounded-[30px] border border-white/[0.08] bg-[#080c12] p-5 sm:p-6">
          <div>
            <p className="text-[12px] font-black uppercase tracking-[.14em] text-[#79eaf2]">
              РЕЗУЛЬТАТ
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-[-.035em] text-[#fff8e7]">
              {isFind ? 'Находки и возможности' : 'Факты и выводы'}
            </h2>
          </div>

          {!summary && sources.length === 0 ? (
            <div className="flex min-h-[460px] items-center justify-center text-center">
              <div>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[20px] border border-white/[0.08] bg-white/[0.025] text-2xl text-[#79eaf2]">
                  ⌕
                </div>
                <p className="mt-4 text-lg font-black text-white/76">
                  Источники появятся здесь
                </p>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/54">
                  Сначала OSA ищет данные в интернете. Только после этого собирается вывод.
                </p>
              </div>
            </div>
          ) : (
            <>
              {summary ? (
                <div className="mt-5 whitespace-pre-wrap rounded-[22px] border border-white/[0.08] bg-white/[0.025] p-5 text-base leading-7 text-white/82">
                  {summary}
                </div>
              ) : null}

              {sources.length > 0 ? (
                <div className="mt-5">
                  <p className="text-[12px] font-black uppercase tracking-[.13em] text-[#f1c96c]">
                    ИСТОЧНИКИ
                  </p>
                  <div className="mt-3 grid gap-3">
                    {sources.map((source, index) => (
                      <a
                        key={source.url}
                        href={source.url}
                        target="_blank"
                        rel="noreferrer"
                        className="group rounded-[18px] border border-white/[0.08] bg-white/[0.02] p-4 transition hover:border-[#69e4ee]/24 hover:bg-[#69e4ee]/[0.025]"
                      >
                        <div className="flex items-start gap-3">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[#69e4ee]/12 bg-[#69e4ee]/[0.04] text-[11px] font-black text-[#79eaf2]">
                            {index + 1}
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-black text-[#fff8e7] group-hover:text-white">
                              {source.title}
                            </p>
                            {source.description ? (
                              <p className="mt-1 text-sm leading-6 text-white/62">
                                {source.description}
                              </p>
                            ) : null}
                            <p className="mt-2 truncate text-[11px] text-[#79eaf2]/70">
                              {source.url}
                            </p>
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>
      </section>
    </main>
  );
}
