'use client';

import Link from 'next/link';
import { useMemo, useState, useTransition } from 'react';

import { attachMediaAssetToProjectAction } from '@/app/(dashboard)/media/actions';
import type { MediaLibraryData, MediaLibraryItem } from '@/utils/media/load-media-library';

type MediaLibraryProps = {
  data: MediaLibraryData;
};

type KindFilter = 'all' | MediaLibraryItem['kind'];

function kindLabel(kind: MediaLibraryItem['kind']) {
  if (kind === 'image') return 'Изображение';
  if (kind === 'audio') return 'Аудио';
  return 'Видео';
}

function kindIcon(kind: MediaLibraryItem['kind']) {
  if (kind === 'image') return '◇';
  if (kind === 'audio') return '◉';
  return '▶';
}

function formatBytes(value: number | null) {
  if (!value || value <= 0) return '—';
  if (value >= 1024 * 1024) return (value / (1024 * 1024)).toFixed(1) + ' МБ';
  if (value >= 1024) return (value / 1024).toFixed(0) + ' КБ';
  return value + ' Б';
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function titleForItem(item: MediaLibraryItem) {
  const metadataTitle =
    typeof item.metadata.title === 'string' ? item.metadata.title.trim() : '';

  if (metadataTitle) return metadataTitle;

  if (item.provider === 'browser-export') return 'Финальный ролик';
  if (item.kind === 'image') return 'Сгенерированное изображение';
  if (item.kind === 'audio') return 'Сгенерированная озвучка';
  return 'Сгенерированное видео';
}

export function MediaLibrary({ data }: MediaLibraryProps) {
  const [filter, setFilter] = useState<KindFilter>('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [projectLinks, setProjectLinks] = useState<Record<string, string | null>>(
    () => Object.fromEntries(data.items.map((item) => [item.id, item.projectId])),
  );
  const [message, setMessage] = useState('');
  const [isSaving, startSaving] = useTransition();

  const items = useMemo(() => {
    return data.items.filter((item) => {
      const linkedProject = projectLinks[item.id] ?? null;
      const kindMatches = filter === 'all' || item.kind === filter;
      const projectMatches =
        projectFilter === 'all'
          ? true
          : projectFilter === 'none'
            ? !linkedProject
            : linkedProject === projectFilter;

      return kindMatches && projectMatches;
    });
  }, [data.items, filter, projectFilter, projectLinks]);

  const stats = [
    { label: 'Всего', value: data.total, filter: 'all' as const },
    { label: 'Видео', value: data.counts.video, filter: 'video' as const },
    { label: 'Изображения', value: data.counts.image, filter: 'image' as const },
    { label: 'Аудио', value: data.counts.audio, filter: 'audio' as const },
  ];

  const changeProject = (assetId: string, nextProjectId: string) => {
    const projectId = nextProjectId || null;
    setProjectLinks((current) => ({ ...current, [assetId]: projectId }));
    setMessage('');

    startSaving(async () => {
      const result = await attachMediaAssetToProjectAction(assetId, projectId);

      if (!result.ok) {
        setMessage(result.message);
        setProjectLinks((current) => ({
          ...current,
          [assetId]: data.items.find((item) => item.id === assetId)?.projectId ?? null,
        }));
        return;
      }

      setMessage(projectId ? 'Файл привязан к проекту.' : 'Файл отвязан от проекта.');
    });
  };

  return (
    <main className="relative min-h-full overflow-hidden bg-[#06080c] text-[#f7f2e8]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(255,255,255,.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.022)_1px,transparent_1px)] [background-size:46px_46px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 -top-28 h-[460px] w-[460px] rounded-full bg-[radial-gradient(circle,rgba(88,219,232,.08),transparent_68%)] blur-3xl"
      />

      <div className="relative z-[1] mx-auto w-full max-w-[1280px] px-4 pb-20 pt-6 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-[#58dbe8]">
              Бизнес-Завод · Медиатека
            </p>
            <h1 className="mt-3 text-[clamp(2.3rem,5vw,4.8rem)] font-semibold leading-[.95] tracking-[-0.06em] text-[#fff8e7]">
              Все готовые медиа
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/42">
              Видео, изображения и озвучка из приватного хранилища. Теперь их можно сразу
              привязывать к рабочим проектам.
            </p>
          </div>

          <Link
            href="/modules/create/studio"
            className="rounded-2xl bg-[linear-gradient(135deg,#f2d474,#c68a26)] px-5 py-3 text-sm font-extrabold text-[#181006] shadow-[0_16px_34px_-20px_rgba(231,185,82,.8)]"
          >
            + Создать медиа
          </Link>
        </header>

        <section className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const active = filter === stat.filter;
            return (
              <button
                key={stat.label}
                type="button"
                onClick={() => setFilter(stat.filter)}
                className={[
                  'rounded-[22px] border p-4 text-left transition',
                  active
                    ? 'border-[#58dbe8]/25 bg-[#58dbe8]/[0.06]'
                    : 'border-white/[0.07] bg-white/[0.025] hover:bg-white/[0.04]',
                ].join(' ')}
              >
                <p className="text-[10px] uppercase tracking-[0.14em] text-white/30">{stat.label}</p>
                <p className="mt-2 text-2xl font-semibold text-[#fff8e7]">{stat.value}</p>
              </button>
            );
          })}
        </section>

        <section className="mt-4 flex flex-wrap items-center gap-3 rounded-[20px] border border-white/[0.06] bg-white/[0.02] p-3">
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/30">
            Проект
          </span>
          <select
            value={projectFilter}
            onChange={(event) => setProjectFilter(event.target.value)}
            className="min-w-[220px] rounded-xl border border-white/[0.07] bg-[#0a0e15] px-3 py-2 text-xs text-white outline-none"
          >
            <option value="all">Все проекты</option>
            <option value="none">Без проекта</option>
            {data.projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>

          {message ? (
            <span className="text-[10px] text-emerald-200/60">{message}</span>
          ) : null}
          {isSaving ? (
            <span className="text-[10px] text-[#8ceaf2]/60">Сохраняю…</span>
          ) : null}
        </section>

        {items.length === 0 ? (
          <section className="mt-6 rounded-[30px] border border-dashed border-white/[0.09] bg-white/[0.02] px-6 py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.025] text-2xl text-white/20">
              ◫
            </div>
            <h2 className="mt-5 text-xl font-semibold text-[#fff8e7]">
              {data.total === 0 ? 'Медиатека пока пустая' : 'По этому фильтру ничего нет'}
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-white/34">
              {data.total === 0
                ? 'После первой сохранённой генерации файл появится здесь автоматически.'
                : 'Смените тип медиа или проект.'}
            </p>
            <Link
              href="/modules/create/studio"
              className="mt-6 inline-flex rounded-2xl border border-[#e7b952]/20 px-4 py-2.5 text-xs font-semibold text-[#f2d474]"
            >
              Открыть Цех создания →
            </Link>
          </section>
        ) : (
          <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => {
              const linkedProjectId = projectLinks[item.id] ?? '';
              const linkedProjectName =
                data.projects.find((project) => project.id === linkedProjectId)?.name ?? null;

              return (
                <article
                  key={item.id}
                  className="group overflow-hidden rounded-[24px] border border-white/[0.07] bg-white/[0.025] transition hover:-translate-y-0.5 hover:border-[#58dbe8]/18"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-black/35">
                    {item.kind === 'image' && item.signedUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.signedUrl}
                        alt="Сохранённое изображение"
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                      />
                    ) : item.kind === 'video' && item.signedUrl ? (
                      <video
                        src={item.signedUrl}
                        className="h-full w-full object-cover"
                        preload="metadata"
                        muted
                        playsInline
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <span className="text-4xl text-white/16">{kindIcon(item.kind)}</span>
                      </div>
                    )}

                    <span className="absolute left-3 top-3 rounded-full border border-white/[0.08] bg-black/55 px-2.5 py-1 text-[9px] font-bold text-white/70 backdrop-blur">
                      {kindLabel(item.kind)}
                    </span>
                  </div>

                  <div className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#fff8e7]">
                          {titleForItem(item)}
                        </p>
                        <p className="mt-1 text-[10px] text-white/28">
                          {formatDate(item.createdAt)} · {formatBytes(item.byteSize)}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full border border-emerald-300/10 bg-emerald-300/[0.04] px-2 py-1 text-[8px] font-bold uppercase tracking-[0.12em] text-emerald-200/70">
                        saved
                      </span>
                    </div>

                    {item.kind === 'audio' && item.signedUrl ? (
                      <audio className="mt-4 h-9 w-full" controls preload="none" src={item.signedUrl}>
                        Аудио недоступно.
                      </audio>
                    ) : null}

                    <div className="mt-4 rounded-xl border border-white/[0.055] bg-black/15 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-white/25">
                          Проект
                        </span>
                        {linkedProjectName ? (
                          <Link
                            href={'/projects/' + linkedProjectId}
                            className="truncate text-[9px] font-semibold text-[#8ceaf2] hover:text-white"
                          >
                            {linkedProjectName} ↗
                          </Link>
                        ) : (
                          <span className="text-[9px] text-white/20">не выбран</span>
                        )}
                      </div>
                      <select
                        value={linkedProjectId}
                        onChange={(event) => changeProject(item.id, event.target.value)}
                        disabled={isSaving}
                        className="mt-2 w-full rounded-lg border border-white/[0.06] bg-[#0a0e15] px-2.5 py-2 text-[10px] text-white/55 outline-none disabled:opacity-45"
                      >
                        <option value="">Без проекта</option>
                        {data.projects.map((project) => (
                          <option key={project.id} value={project.id}>
                            {project.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <span className="text-[9px] uppercase tracking-[0.12em] text-white/20">
                        {item.provider}
                      </span>
                      {item.signedUrl ? (
                        <a
                          href={item.signedUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] font-semibold text-[#8ceaf2] hover:text-white"
                        >
                          Открыть файл ↗
                        </a>
                      ) : (
                        <span className="text-[10px] text-white/22">Ссылка недоступна</span>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}
