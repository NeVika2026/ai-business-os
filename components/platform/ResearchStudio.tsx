'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { getFactoryArtifactAction } from '@/app/(dashboard)/modules/factory-chain/actions';
import {
  runResearchAction,
  type PriorResearchContext,
  type ResearchMode,
  type ResearchSource,
} from '@/app/(dashboard)/modules/research/actions';
import { FactoryChainBar } from '@/components/platform/FactoryChainBar';

type ResearchStudioProps = {
  mode: ResearchMode;
  initialQuery?: string;
  initialProjectId?: string | null;
  initialArtifactId?: string | null;
};

const RESEARCH_HANDOFF_KEY = 'business-zavod:research-handoff';
const CREATE_HANDOFF_KEY = 'business-zavod:create-handoff';
const PUBLISH_HANDOFF_KEY = 'business-zavod:publish-source';

function sourceList(sources: ResearchSource[]): string {
  return sources
    .map((source, index) => `[${index + 1}] ${source.title}\n${source.url}`)
    .join('\n');
}

export function ResearchStudio({
  mode,
  initialQuery = '',
  initialProjectId = null,
  initialArtifactId = null,
}: ResearchStudioProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [projectId, setProjectId] = useState<string | null>(initialProjectId);
  const [summary, setSummary] = useState('');
  const [sources, setSources] = useState<ResearchSource[]>([]);
  const [error, setError] = useState('');
  const [handoffMessage, setHandoffMessage] = useState('');
  const [isPending, startTransition] = useTransition();

  const isFind = mode === 'find';

  const executeResearch = (
    queryValue: string,
    priorContext?: PriorResearchContext | null,
  ) => {
    const trimmed = queryValue.trim();
    if (!trimmed || isPending) return;

    setError('');
    setSummary('');
    if (!priorContext) setSources([]);

    startTransition(async () => {
      const result = await runResearchAction({
        mode,
        query: trimmed,
        projectId,
        priorContext: priorContext ?? null,
      });

      if (result.status === 'failed') {
        setError(result.message);
        setSources(result.sources ?? priorContext?.sources ?? []);
        return;
      }

      setProjectId(result.projectId);
      setSummary(result.summary);
      setSources(result.sources);
    });
  };

  useEffect(() => {
    const restore = async () => {
      if (mode === 'analyze') {
        const raw = window.sessionStorage.getItem(RESEARCH_HANDOFF_KEY);

        if (raw) {
          window.sessionStorage.removeItem(RESEARCH_HANDOFF_KEY);

          try {
            const prior = JSON.parse(raw) as PriorResearchContext;
            if (prior.query?.trim() && Array.isArray(prior.sources) && prior.sources.length) {
              setQuery(prior.query);
              setSources(prior.sources);
              setHandoffMessage('Результат из цеха поиска принят. Анализ запущен автоматически.');
              executeResearch(prior.query, prior);
              return;
            }
          } catch {
            setHandoffMessage('');
          }
        }
      }

      if (!initialProjectId || !initialArtifactId) return;

      const artifact = await getFactoryArtifactAction(initialProjectId, initialArtifactId);
      if (!artifact) return;

      const artifactQuery =
        typeof artifact.metadata.query === 'string' && artifact.metadata.query.trim()
          ? artifact.metadata.query.trim()
          : initialQuery || artifact.title;

      const restoredSources: ResearchSource[] = artifact.sources.map((source) => ({
        title: source.title,
        url: source.url,
        description: source.description ?? '',
        source: null,
        age: null,
      }));

      setProjectId(initialProjectId);
      setQuery(artifactQuery);
      setSources(restoredSources);

      if (mode === 'analyze' && artifact.stage === 'find' && restoredSources.length) {
        setHandoffMessage('Сохранённый результат поиска восстановлен. Анализ запущен автоматически.');
        executeResearch(artifactQuery, {
          query: artifactQuery,
          summary: artifact.content,
          sources: restoredSources,
        });
        return;
      }

      setSummary(artifact.content);
      setHandoffMessage('Сохранённый результат проекта восстановлен.');
    };

    void restore();
    // Restore is intentionally consumed once on entry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, initialArtifactId, initialProjectId]);

  const runResearch = () => {
    executeResearch(query);
  };

  const continueToAnalyze = () => {
    if (!summary || !sources.length) return;

    const payload: PriorResearchContext = {
      query,
      summary,
      sources,
    };

    window.sessionStorage.setItem(RESEARCH_HANDOFF_KEY, JSON.stringify(payload));
    router.push(
      '/modules/analyze/studio' +
        (projectId ? '?project=' + encodeURIComponent(projectId) : ''),
    );
  };

  const continueToCreate = () => {
    if (!summary) return;

    const context = [
      mode === 'find' ? 'Результат поиска:' : 'Результат анализа:',
      summary,
      sources.length ? '\nИсточники:\n' + sourceList(sources) : '',
    ]
      .filter(Boolean)
      .join('\n\n');

    window.sessionStorage.setItem(
      CREATE_HANDOFF_KEY,
      JSON.stringify({
        goal:
          mode === 'find'
            ? 'Создай рабочий материал на основе результатов исследования.'
            : 'Создай рабочий материал на основе этого анализа.',
        context,
        sourceStage: mode,
      }),
    );

    const params = new URLSearchParams({ mode: 'document' });
    if (projectId) params.set('project', projectId);
    router.push('/modules/create/studio?' + params.toString());
  };

  const continueToPublish = () => {
    if (!summary) return;

    const publicationSource = [
      summary,
      sources.length ? '\nИсточники:\n' + sourceList(sources) : '',
    ]
      .filter(Boolean)
      .join('\n\n');

    window.sessionStorage.setItem(PUBLISH_HANDOFF_KEY, publicationSource);
    router.push(
      '/modules/publish/studio' +
        (projectId ? '?project=' + encodeURIComponent(projectId) : ''),
    );
  };

  return (
    <main className="relative mx-auto w-full max-w-[1320px] overflow-hidden pb-16 text-[#f7f2e8]">
      <FactoryChainBar active={isFind ? 'find' : 'analyze'} />

      {projectId ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[18px] border border-[#69e4ee]/10 bg-[#69e4ee]/[0.025] px-4 py-3">
          <p className="text-sm text-white/64">
            Результаты сохраняются в проект автоматически.
          </p>
          <a
            href={'/projects/' + projectId}
            className="text-xs font-black uppercase tracking-[.1em] text-[#79eaf2]"
          >
            Открыть проект →
          </a>
        </div>
      ) : null}

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
              : 'OSA получает найденные источники, отделяет факты от выводов и собирает рабочий анализ.'}
          </p>
        </div>
      </section>

      {handoffMessage ? (
        <section className="mt-4 rounded-[20px] border border-emerald-300/12 bg-emerald-300/[0.04] px-4 py-3 text-sm font-semibold text-emerald-100/82">
          {handoffMessage}
        </section>
      ) : null}

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
              ? 'OSA проверяет источники…'
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
              Живой веб-поиск использует Brave Search. Если анализ пришёл из цеха поиска,
              найденные источники передаются дальше автоматически и второй раз вводить их не нужно.
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
                  Сначала OSA получает источники. Только после этого собирается вывод.
                </p>
              </div>
            </div>
          ) : (
            <>
              {summary ? (
                <>
                  <div className="mt-5 whitespace-pre-wrap rounded-[22px] border border-white/[0.08] bg-white/[0.025] p-5 text-base leading-7 text-white/82">
                    {summary}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {isFind ? (
                      <button
                        type="button"
                        onClick={continueToAnalyze}
                        disabled={!sources.length}
                        className="rounded-xl bg-[linear-gradient(135deg,#69e4ee,#399fb5)] px-4 py-2.5 text-xs font-black text-[#041015] disabled:opacity-35"
                      >
                        Передать в анализ →
                      </button>
                    ) : null}

                    <button
                      type="button"
                      onClick={continueToCreate}
                      className="rounded-xl bg-[linear-gradient(135deg,#ffe08a,#d79a30)] px-4 py-2.5 text-xs font-black text-[#1b1105]"
                    >
                      В цех создания →
                    </button>

                    <button
                      type="button"
                      onClick={continueToPublish}
                      className="rounded-xl border border-white/[0.10] bg-white/[0.03] px-4 py-2.5 text-xs font-bold text-white/74 hover:border-[#69e4ee]/24 hover:text-white"
                    >
                      Сразу в публикацию
                    </button>
                  </div>
                </>
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
