import Link from 'next/link';

import type { FactoryArtifact, FactoryStage } from '@/lib/factory-chain/persistence';
import { getProjectStatusLabel, getProjectTypeLabel } from '@/utils/projects/project-mappers';
import type { ProjectMediaItem } from '@/utils/projects/project-media-loader';
import type { ProjectWorkspaceData } from '@/utils/projects/project-types';

type ProjectCommandCenterProps = {
  workspace: ProjectWorkspaceData;
  media: ProjectMediaItem[];
  artifacts: FactoryArtifact[];
};

const STAGES: Array<{
  id: FactoryStage;
  number: string;
  label: string;
  short: string;
}> = [
  { id: 'find', number: '01', label: 'Найти', short: 'Источники и возможности' },
  { id: 'analyze', number: '02', label: 'Анализ', short: 'Факты и решения' },
  { id: 'create', number: '03', label: 'Создать', short: 'Готовый материал' },
  { id: 'publish', number: '04', label: 'Опубликовать', short: 'Выпуск по каналам' },
];

function stageIndex(stage: FactoryStage) {
  return STAGES.findIndex((item) => item.id === stage);
}

function formatMoment(value: string | null | undefined) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function buildContinueHref(projectId: string, artifact: FactoryArtifact | null) {
  if (!artifact) {
    return '/modules/find/studio?project=' + encodeURIComponent(projectId);
  }

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

  params.delete('artifact');
  params.set('mode', 'document');
  return '/modules/create/studio?' + params.toString();
}

function continueLabel(artifact: FactoryArtifact | null) {
  if (!artifact) return 'Начать с поиска →';
  if (artifact.stage === 'find') return 'Продолжить анализ →';
  if (artifact.stage === 'analyze') return 'Перейти к созданию →';
  if (artifact.stage === 'create') return 'Подготовить публикацию →';
  return 'Создать новую версию →';
}

export function ProjectCommandCenter({
  workspace,
  media,
  artifacts,
}: ProjectCommandCenterProps) {
  const project = workspace.project;
  const stageCounts = Object.fromEntries(
    STAGES.map((stage) => [
      stage.id,
      artifacts.filter((artifact) => artifact.stage === stage.id).length,
    ]),
  ) as Record<FactoryStage, number>;

  const furthestIndex = artifacts.reduce(
    (max, artifact) => Math.max(max, stageIndex(artifact.stage)),
    -1,
  );
  const activeIndex = furthestIndex < STAGES.length - 1 ? furthestIndex + 1 : STAGES.length - 1;
  const activeStage = STAGES[Math.max(0, activeIndex)];
  const progress = furthestIndex < 0 ? 0 : Math.min(100, (furthestIndex + 1) * 25);
  const sourceArtifact =
    furthestIndex < 0
      ? null
      : artifacts.find((artifact) => stageIndex(artifact.stage) === furthestIndex) ?? artifacts[0] ?? null;
  const latestArtifact = artifacts[0] ?? null;
  const latestActivity =
    latestArtifact?.createdAt ?? workspace.overview.latestActivity?.timestamp ?? project.updatedAt;
  const totalOutputs = artifacts.length + media.length;

  return (
    <section className="relative overflow-hidden rounded-[34px] border border-white/[0.09] bg-[radial-gradient(circle_at_82%_12%,rgba(241,201,108,.13),transparent_28%),radial-gradient(circle_at_18%_18%,rgba(105,228,238,.10),transparent_32%),linear-gradient(145deg,#05080d,#0a1018_56%,#05070b)] p-5 text-[#f7f2e8] shadow-[0_34px_100px_-58px_rgba(0,0,0,.96)] sm:p-7 lg:p-8">
      <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.025)_1px,transparent_1px)] [background-size:44px_44px]" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-[8%] top-8 h-48 w-48 rounded-full border border-[#69e4ee]/10 shadow-[0_0_80px_rgba(105,228,238,.08),inset_0_0_50px_rgba(241,201,108,.04)]"
      />

      <div className="relative">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-4xl">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/projects"
                className="text-[12px] font-black uppercase tracking-[.15em] text-[#79eaf2]"
              >
                БИЗНЕС ЗАВОД · ПРОЕКТ
              </Link>
              <span className="text-white/24">/</span>
              <span className="text-[12px] font-bold uppercase tracking-[.12em] text-white/46">
                {getProjectTypeLabel(project.type)}
              </span>
              <span className="rounded-full border border-emerald-300/14 bg-emerald-300/[0.05] px-2.5 py-1 text-[10px] font-black uppercase tracking-[.1em] text-emerald-200/86">
                {getProjectStatusLabel(project.status)}
              </span>
            </div>

            <div className="mt-5 flex items-start gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[20px] border border-[#f1c96c]/16 bg-[linear-gradient(145deg,rgba(241,201,108,.10),rgba(105,228,238,.04))] text-3xl shadow-[0_0_38px_rgba(241,201,108,.07)]">
                {project.icon ?? '⚙️'}
              </div>
              <div>
                <h1 className="text-[clamp(2.2rem,5vw,4.8rem)] font-black leading-[.96] tracking-[-.06em] text-[#fff8e7]">
                  {project.name}
                </h1>
                <p className="mt-3 max-w-3xl text-base leading-7 text-white/66 sm:text-lg">
                  {workspace.overview.description?.trim() ||
                    'Проект Бизнес-Завода. Все этапы, материалы и решения собраны в одном месте.'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid min-w-[280px] grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-2">
            <Metric label="Готовность" value={progress + '%'} accent />
            <Metric label="Результаты" value={String(totalOutputs)} />
            <Metric label="Медиа" value={String(media.length)} />
            <Metric label="Обновлён" value={formatMoment(latestActivity)} compact />
          </div>
        </div>

        <div className="mt-7 rounded-[26px] border border-white/[0.075] bg-black/20 p-4 sm:p-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[.14em] text-[#f1c96c]">
                ПРОИЗВОДСТВЕННАЯ ЛИНИЯ
              </p>
              <h2 className="mt-1 text-xl font-black text-[#fff8e7]">
                {progress === 100
                  ? 'Цепочка пройдена · можно выпускать новые версии'
                  : 'Текущий этап · ' + activeStage.label}
              </h2>
            </div>
            <span className="text-sm font-bold text-white/52">
              {artifacts.length} сохранённых этапов
            </span>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {STAGES.map((stage, index) => {
              const completed = index <= furthestIndex;
              const active = index === activeIndex && progress < 100;
              const count = stageCounts[stage.id];

              return (
                <Link
                  key={stage.id}
                  href={'/modules/' + stage.id + '/studio?project=' + encodeURIComponent(project.id)}
                  className={[
                    'group relative overflow-hidden rounded-[20px] border p-4 transition',
                    active
                      ? 'border-[#69e4ee]/34 bg-[#69e4ee]/[0.07] shadow-[0_18px_50px_-32px_rgba(105,228,238,.6)]'
                      : completed
                        ? 'border-[#f1c96c]/18 bg-[#f1c96c]/[0.035]'
                        : 'border-white/[0.07] bg-white/[0.018] hover:border-white/15',
                  ].join(' ')}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span
                      className={[
                        'text-[11px] font-black tracking-[.13em]',
                        active ? 'text-[#79eaf2]' : completed ? 'text-[#f1c96c]' : 'text-white/38',
                      ].join(' ')}
                    >
                      {stage.number}
                    </span>
                    <span
                      className={[
                        'rounded-full px-2 py-1 text-[9px] font-black uppercase tracking-[.1em]',
                        active
                          ? 'bg-[#69e4ee]/10 text-[#9af4fa]'
                          : completed
                            ? 'bg-[#f1c96c]/8 text-[#f3d681]'
                            : 'bg-white/[0.035] text-white/34',
                      ].join(' ')}
                    >
                      {active ? 'СЕЙЧАС' : completed ? 'ГОТОВО' : 'ДАЛЬШЕ'}
                    </span>
                  </div>
                  <h3 className="mt-4 text-lg font-black text-[#fff8e7]">{stage.label}</h3>
                  <p className="mt-1 text-sm leading-6 text-white/56">{stage.short}</p>
                  <p className="mt-3 text-[11px] font-bold text-white/38">
                    {count ? count + ' результатов' : 'Нет результатов'}
                  </p>
                </Link>
              );
            })}
          </div>

          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.055]">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,#69e4ee,#f1c96c)] shadow-[0_0_20px_rgba(105,228,238,.35)]"
              style={{ width: progress + '%' }}
            />
          </div>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-[1.3fr_.7fr]">
          <div className="rounded-[24px] border border-white/[0.075] bg-white/[0.025] p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[.13em] text-[#79eaf2]">
                  ПОСЛЕДНИЙ РЕЗУЛЬТАТ
                </p>
                <h2 className="mt-2 text-xl font-black text-[#fff8e7]">
                  {latestArtifact?.title ?? 'Производство ещё не запускалось'}
                </h2>
              </div>
              {latestArtifact ? (
                <time className="text-xs font-semibold text-white/40">
                  {formatMoment(latestArtifact.createdAt)}
                </time>
              ) : null}
            </div>

            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-white/66">
              {latestArtifact
                ? latestArtifact.content.length > 520
                  ? latestArtifact.content.slice(0, 517).trimEnd() + '…'
                  : latestArtifact.content
                : 'Начните с поиска или поставьте OSA задачу — первый сохранённый результат появится здесь.'}
            </p>

            {latestArtifact?.sources.length ? (
              <p className="mt-3 text-xs font-bold text-[#79eaf2]/72">
                Источников: {latestArtifact.sources.length}
              </p>
            ) : null}
          </div>

          <div className="rounded-[24px] border border-[#f1c96c]/12 bg-[#f1c96c]/[0.025] p-5">
            <p className="text-[11px] font-black uppercase tracking-[.13em] text-[#f1c96c]">
              СЛЕДУЮЩЕЕ ДЕЙСТВИЕ
            </p>
            <p className="mt-2 text-lg font-black text-[#fff8e7]">
              {continueLabel(sourceArtifact).replace(' →', '')}
            </p>
            <p className="mt-2 text-sm leading-6 text-white/58">
              OSA продолжит этот же проект и возьмёт сохранённый результат как исходный контекст.
            </p>

            <Link
              href={buildContinueHref(project.id, sourceArtifact)}
              className="mt-4 flex w-full items-center justify-center rounded-[16px] bg-[linear-gradient(135deg,#ffe08a,#d79a30)] px-4 py-3 text-sm font-black text-[#1b1105] transition hover:-translate-y-0.5 hover:brightness-105"
            >
              {continueLabel(sourceArtifact)}
            </Link>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <Link
                href={'/modules/create/studio?project=' + encodeURIComponent(project.id)}
                className="rounded-xl border border-white/[0.09] bg-white/[0.025] px-3 py-2.5 text-center text-[11px] font-bold text-white/70 hover:border-[#69e4ee]/22 hover:text-white"
              >
                Новая версия
              </Link>
              <Link
                href={'/modules/publish/studio?project=' + encodeURIComponent(project.id)}
                className="rounded-xl border border-white/[0.09] bg-white/[0.025] px-3 py-2.5 text-center text-[11px] font-bold text-white/70 hover:border-[#69e4ee]/22 hover:text-white"
              >
                Публикация
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Metric({
  label,
  value,
  accent = false,
  compact = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
  compact?: boolean;
}) {
  return (
    <div className="rounded-[18px] border border-white/[0.075] bg-black/20 p-3">
      <p className="text-[10px] font-black uppercase tracking-[.11em] text-white/38">{label}</p>
      <p
        className={[
          'mt-1 font-black',
          compact ? 'text-sm' : 'text-2xl',
          accent ? 'text-[#f1c96c]' : 'text-[#fff8e7]',
        ].join(' ')}
      >
        {value}
      </p>
    </div>
  );
}
