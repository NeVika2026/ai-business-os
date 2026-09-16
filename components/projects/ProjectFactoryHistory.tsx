import Link from 'next/link';

import type { FactoryArtifact, FactoryStage } from '@/lib/factory-chain/persistence';

type ProjectFactoryHistoryProps = {
  projectId: string;
  artifacts: FactoryArtifact[];
};

const STAGE_LABELS: Record<FactoryStage, string> = {
  find: 'Найти',
  analyze: 'Анализ',
  create: 'Создать',
  publish: 'Опубликовать',
};

function resumeHref(projectId: string, artifact: FactoryArtifact): string {
  const params = new URLSearchParams({
    project: projectId,
    artifact: artifact.id,
  });

  if (artifact.stage === 'find') {
    return '/modules/analyze/studio?' + params.toString();
  }

  if (artifact.stage === 'analyze') {
    params.set('mode', 'document');
    return '/modules/create/studio?' + params.toString();
  }

  if (artifact.stage === 'create') {
    return '/modules/publish/studio?' + params.toString();
  }

  return '/modules/publish/studio?' + params.toString();
}

function resumeLabel(stage: FactoryStage): string {
  if (stage === 'find') return 'Продолжить в анализе →';
  if (stage === 'analyze') return 'Продолжить в создании →';
  if (stage === 'create') return 'Продолжить в публикации →';
  return 'Открыть публикацию →';
}

export function ProjectFactoryHistory({
  projectId,
  artifacts,
}: ProjectFactoryHistoryProps) {
  if (!artifacts.length) {
    return (
      <section className="rounded-[26px] border border-white/[0.08] bg-white/[0.025] p-5">
        <p className="text-[12px] font-black uppercase tracking-[.14em] text-[#79eaf2]">
          ИСТОРИЯ БИЗНЕС-ЗАВОДА
        </p>
        <h2 className="mt-2 text-2xl font-black text-[#fff8e7]">
          Пока нет сохранённых этапов
        </h2>
        <p className="mt-2 text-sm leading-6 text-white/60">
          Как только проект пройдёт через «Найти», «Анализ», «Создать» или «Опубликовать»,
          результаты появятся здесь автоматически.
        </p>
        <Link
          href={'/modules/find/studio?project=' + encodeURIComponent(projectId)}
          className="mt-4 inline-flex rounded-xl bg-[linear-gradient(135deg,#ffe08a,#d79a30)] px-4 py-2.5 text-xs font-black text-[#1b1105]"
        >
          Запустить цепочку →
        </Link>
      </section>
    );
  }

  return (
    <section className="rounded-[30px] border border-white/[0.08] bg-[#080c12] p-5 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[12px] font-black uppercase tracking-[.14em] text-[#79eaf2]">
            ИСТОРИЯ БИЗНЕС-ЗАВОДА
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-[-.035em] text-[#fff8e7]">
            Все этапы и результаты проекта
          </h2>
        </div>
        <span className="rounded-full border border-white/[0.08] bg-white/[0.025] px-3 py-1.5 text-xs font-bold text-white/58">
          {artifacts.length} сохранено
        </span>
      </div>

      <div className="mt-5 grid gap-3">
        {artifacts.map((artifact, index) => {
          const preview =
            artifact.content.length > 360
              ? artifact.content.slice(0, 357).trimEnd() + '…'
              : artifact.content;

          return (
            <article
              key={artifact.id}
              className="rounded-[22px] border border-white/[0.08] bg-white/[0.025] p-4 sm:p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#69e4ee]/12 bg-[#69e4ee]/[0.04] text-[11px] font-black text-[#79eaf2]">
                    {String(artifacts.length - index).padStart(2, '0')}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-black uppercase tracking-[.13em] text-[#f1c96c]">
                      {STAGE_LABELS[artifact.stage]}
                    </p>
                    <h3 className="mt-1 text-lg font-black text-[#fff8e7]">
                      {artifact.title}
                    </h3>
                  </div>
                </div>
                <time className="text-xs text-white/42">
                  {new Date(artifact.createdAt).toLocaleString('ru-RU')}
                </time>
              </div>

              <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-white/68">
                {preview}
              </p>

              {artifact.sources.length ? (
                <p className="mt-3 text-xs font-semibold text-[#79eaf2]/72">
                  Источников: {artifact.sources.length}
                </p>
              ) : null}

              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href={resumeHref(projectId, artifact)}
                  className="rounded-xl bg-[linear-gradient(135deg,#69e4ee,#399fb5)] px-3.5 py-2.5 text-xs font-black text-[#041015]"
                >
                  {resumeLabel(artifact.stage)}
                </Link>
                <Link
                  href={'/modules/' + artifact.stage + '/studio?project=' + encodeURIComponent(projectId)}
                  className="rounded-xl border border-white/[0.10] bg-white/[0.03] px-3.5 py-2.5 text-xs font-bold text-white/68 hover:text-white"
                >
                  Открыть цех
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
