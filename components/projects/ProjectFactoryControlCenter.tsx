import Link from 'next/link';

import type { FactoryArtifact, FactoryStage } from '@/lib/factory-chain/persistence';
import type { ProjectMediaItem } from '@/utils/projects/project-media-loader';
import {
  buildProjectFactoryCenter,
  PROJECT_FACTORY_STAGE_ORDER,
} from '@/utils/projects/project-factory-center';

type ProjectFactoryControlCenterProps = {
  projectId: string;
  artifacts: FactoryArtifact[];
  media: ProjectMediaItem[];
};

const STAGE_COPY: Record<FactoryStage, string> = {
  find: 'Источники и возможности',
  analyze: 'Факты, риски и выводы',
  create: 'Материалы и медиа',
  publish: 'Каналы и выпуск',
};

function preview(value: string, max = 320): string {
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (normalized.length <= max) return normalized;
  return normalized.slice(0, max - 1).trimEnd() + '…';
}

function stageTone(status: 'done' | 'current' | 'pending'): string {
  if (status === 'done') {
    return 'border-emerald-300/18 bg-emerald-300/[0.045]';
  }

  if (status === 'current') {
    return 'border-[#69e4ee]/30 bg-[#69e4ee]/[0.065] shadow-[0_16px_50px_-34px_rgba(105,228,238,.55)]';
  }

  return 'border-white/[0.07] bg-white/[0.018]';
}

function stageStatusLabel(status: 'done' | 'current' | 'pending'): string {
  if (status === 'done') return 'ГОТОВО';
  if (status === 'current') return 'СЛЕДУЮЩИЙ ШАГ';
  return 'ОЖИДАЕТ';
}

export function ProjectFactoryControlCenter({
  projectId,
  artifacts,
  media,
}: ProjectFactoryControlCenterProps) {
  const center = buildProjectFactoryCenter({
    projectId,
    artifacts,
    mediaCount: media.length,
  });
  const latestMedia = media[0] ?? null;
  const latestPublication = center.stageStates.publish.latestArtifact;

  return (
    <section className="relative overflow-hidden rounded-[32px] border border-white/[0.09] bg-[radial-gradient(circle_at_78%_12%,rgba(105,228,238,.09),transparent_34%),radial-gradient(circle_at_12%_88%,rgba(241,201,108,.08),transparent_30%),linear-gradient(145deg,#070a0f,#0b1017_58%,#07090d)] p-5 sm:p-6">
      <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] [background-size:42px_42px]" />

      <div className="relative">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="text-[12px] font-black uppercase tracking-[.16em] text-[#79eaf2]">
              ЦЕНТР УПРАВЛЕНИЯ ПРОЕКТОМ
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-[-.045em] text-[#fff8e7] sm:text-4xl">
              Производственная цепочка
            </h2>
            <p className="mt-3 max-w-2xl text-base leading-7 text-white/68">
              Видно, что уже сделано, где находится проект сейчас и куда продолжать дальше.
            </p>
          </div>

          <div className="min-w-[210px] rounded-[22px] border border-white/[0.08] bg-black/20 p-4">
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs font-bold text-white/54">Готовность цепочки</span>
              <strong className="text-lg font-black text-[#f4d878]">
                {center.progressPercent}%
              </strong>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#69e4ee,#f1c96c)] transition-[width] duration-500"
                style={{ width: `${center.progressPercent}%` }}
              />
            </div>
            <p className="mt-2 text-xs leading-5 text-white/48">
              {center.completedStageCount} из {PROJECT_FACTORY_STAGE_ORDER.length} этапов имеют сохранённый результат
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {PROJECT_FACTORY_STAGE_ORDER.map((stage, index) => {
            const state = center.stageStates[stage];
            const hasArtifact = Boolean(state.latestArtifact);

            return (
              <article
                key={stage}
                className={`relative min-h-[156px] rounded-[22px] border p-4 ${stageTone(state.status)}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="text-[11px] font-black uppercase tracking-[.13em] text-[#79eaf2]">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span
                    className={[
                      'rounded-full border px-2 py-1 text-[9px] font-black tracking-[.08em]',
                      state.status === 'done'
                        ? 'border-emerald-300/14 text-emerald-200/82'
                        : state.status === 'current'
                          ? 'border-[#69e4ee]/20 text-[#9ff4f8]'
                          : 'border-white/[0.07] text-white/34',
                    ].join(' ')}
                  >
                    {stageStatusLabel(state.status)}
                  </span>
                </div>

                <h3 className="mt-4 text-xl font-black text-[#fff8e7]">{state.label}</h3>
                <p className="mt-1 text-sm leading-6 text-white/58">{STAGE_COPY[stage]}</p>

                <p className="mt-3 text-xs text-white/42">
                  {hasArtifact && state.latestArtifact
                    ? new Date(state.latestArtifact.createdAt).toLocaleString('ru-RU')
                    : state.status === 'current'
                      ? 'Можно продолжить отсюда'
                      : 'Результата пока нет'}
                </p>
              </article>
            );
          })}
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-[1.3fr_.7fr]">
          <div className="rounded-[24px] border border-white/[0.08] bg-black/20 p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[.13em] text-[#f1c96c]">
                  ПОСЛЕДНИЙ РЕЗУЛЬТАТ
                </p>
                <h3 className="mt-2 text-xl font-black text-[#fff8e7]">
                  {center.latestArtifact?.title ?? 'Проект готов к первому запуску'}
                </h3>
              </div>
              {center.latestArtifact ? (
                <span className="rounded-full border border-white/[0.08] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.08em] text-white/52">
                  {center.stageStates[center.latestArtifact.stage].label}
                </span>
              ) : null}
            </div>

            <p className="mt-4 text-sm leading-7 text-white/68">
              {center.latestArtifact
                ? preview(center.latestArtifact.content)
                : 'Начните с поиска, анализа или сразу переходите в создание — первый сохранённый результат автоматически появится в проекте.'}
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href={center.continueHref}
                className="rounded-xl bg-[linear-gradient(135deg,#ffe08a,#d79a30)] px-4 py-2.5 text-xs font-black text-[#1b1105] shadow-[0_14px_32px_-20px_rgba(241,201,108,.55)]"
              >
                {center.continueLabel}
              </Link>
              <Link
                href={'/modules/find/studio?project=' + encodeURIComponent(projectId)}
                className="rounded-xl border border-white/[0.10] bg-white/[0.03] px-4 py-2.5 text-xs font-bold text-white/68 hover:border-[#69e4ee]/24 hover:text-white"
              >
                Новый проход цепочки
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <div className="rounded-[20px] border border-white/[0.08] bg-white/[0.025] p-4">
              <p className="text-[11px] font-black uppercase tracking-[.12em] text-[#79eaf2]">РЕЗУЛЬТАТЫ</p>
              <div className="mt-2 flex items-end justify-between gap-3">
                <strong className="text-3xl font-black text-[#fff8e7]">{center.artifactCount}</strong>
                <span className="text-xs text-white/42">сохранено</span>
              </div>
            </div>

            <div className="rounded-[20px] border border-white/[0.08] bg-white/[0.025] p-4">
              <p className="text-[11px] font-black uppercase tracking-[.12em] text-[#f1c96c]">МЕДИА</p>
              <div className="mt-2 flex items-end justify-between gap-3">
                <strong className="text-3xl font-black text-[#fff8e7]">{center.mediaCount}</strong>
                <span className="max-w-[150px] truncate text-xs text-white/42">
                  {latestMedia?.title ?? 'файлов пока нет'}
                </span>
              </div>
            </div>

            <div className="rounded-[20px] border border-white/[0.08] bg-white/[0.025] p-4">
              <p className="text-[11px] font-black uppercase tracking-[.12em] text-emerald-200/80">ПУБЛИКАЦИИ</p>
              <div className="mt-2 flex items-end justify-between gap-3">
                <strong className="text-3xl font-black text-[#fff8e7]">{center.publicationCount}</strong>
                <span className="max-w-[150px] truncate text-xs text-white/42">
                  {latestPublication?.title ?? 'ещё не выпускали'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
