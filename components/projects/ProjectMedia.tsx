import Link from 'next/link';

import type { ProjectMediaItem } from '@/utils/projects/project-media-loader';

type ProjectMediaProps = {
  projectId: string;
  media: ProjectMediaItem[];
};

function kindLabel(kind: ProjectMediaItem['kind']) {
  if (kind === 'image') return 'Изображение';
  if (kind === 'audio') return 'Аудио';
  return 'Видео';
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function buildAsSourceHref(item: ProjectMediaItem, projectId: string) {
  if (!item.signedUrl) return null;

  const encoded = encodeURIComponent(item.signedUrl);
  if (item.kind === 'image') {
    return '/modules/create/upscale?kind=image&project=' + encodeURIComponent(projectId) + '&source=' + encoded;
  }
  if (item.kind === 'video') {
    return '/modules/create/video-edit?mode=edit&project=' + encodeURIComponent(projectId) + '&source=' + encoded;
  }
  return '/modules/create/avatar?mode=audio&project=' + encodeURIComponent(projectId) + '&audio=' + encoded;
}

export function ProjectMedia({ projectId, media }: ProjectMediaProps) {
  const sources = media.filter((item) => item.provider === 'upload');
  const results = media.filter((item) => item.provider !== 'upload');

  function renderCards(items: ProjectMediaItem[], mode: 'source' | 'result') {
    if (items.length === 0) {
      return (
        <div className="rounded-xl border border-dashed border-[var(--border-subtle)] bg-[var(--surface-0)] p-5">
          <p className="text-sm text-[var(--text-secondary)]">
            {mode === 'source'
              ? 'Исходников пока нет. Загрузите фото, видео или аудио — они появятся здесь.'
              : 'Готовых медиа-результатов пока нет.'}
          </p>
        </div>
      );
    }

    return (
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <article
            key={item.id}
            className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-0)]"
          >
            <div className="aspect-[16/10] bg-black/10">
              {item.kind === 'image' && item.signedUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.signedUrl}
                  alt={item.title}
                  className="h-full w-full object-cover"
                />
              ) : item.kind === 'video' && item.signedUrl ? (
                <video
                  src={item.signedUrl}
                  muted
                  playsInline
                  preload="metadata"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-2xl text-[var(--text-secondary)]">
                  {item.kind === 'audio' ? '◉' : '▶'}
                </div>
              )}
            </div>

            <div className="p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="min-w-0 flex-1 truncate text-sm font-medium text-[var(--text-primary)]">
                  {item.title}
                </p>
                <span className="shrink-0 rounded-full border border-[var(--border-subtle)] px-2 py-0.5 text-[9px] font-bold uppercase text-[var(--text-secondary)]">
                  {mode === 'source' ? 'исходник' : 'результат'}
                </span>
              </div>

              <p className="mt-1 text-[10px] text-[var(--text-secondary)]">
                {kindLabel(item.kind)} · {formatDate(item.createdAt)}
              </p>

              {item.kind === 'audio' && item.signedUrl ? (
                <audio
                  className="mt-2 h-8 w-full"
                  controls
                  preload="none"
                  src={item.signedUrl}
                >
                  Аудио недоступно.
                </audio>
              ) : null}

              {item.signedUrl ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href={buildAsSourceHref(item, projectId) || '#'}
                    className="inline-flex rounded-lg border border-[var(--accent)]/30 px-2.5 py-1.5 text-[10px] font-semibold text-[var(--accent)] hover:border-[var(--accent)]"
                  >
                    {mode === 'source' ? 'Использовать →' : 'Доработать →'}
                  </Link>
                  <a
                    href={item.signedUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex px-2 py-1.5 text-[10px] font-semibold text-[var(--text-secondary)]"
                  >
                    Открыть ↗
                  </a>
                </div>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    );
  }

  return (
    <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4 sm:p-5">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Медиа проекта: исходники и результаты
          </h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {sources.length} исходников · {results.length} результатов
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={'/modules/create/studio?project=' + projectId}
            className="rounded-xl border border-[var(--border-subtle)] px-3 py-1.5 text-sm hover:border-[var(--accent)]"
          >
            + Создать
          </Link>
          <Link
            href={'/media?project=' + projectId}
            className="rounded-xl border border-[var(--border-subtle)] px-3 py-1.5 text-sm hover:border-[var(--accent)]"
          >
            Открыть Медиатеку
          </Link>
        </div>
      </header>

      {media.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border-subtle)] bg-[var(--surface-0)] p-5">
          <p className="text-sm font-medium text-[var(--text-primary)]">
            В проекте пока нет медиа
          </p>
          <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">
            Загрузите исходник или создайте новый материал — всё будет собрано здесь.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[.12em] text-[var(--accent)]">
                  Исходники
                </p>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">
                  То, что вы загрузили с устройства или выбрали для работы.
                </p>
              </div>
              <span className="text-xs text-[var(--text-secondary)]">{sources.length}</span>
            </div>
            {renderCards(sources, 'source')}
          </div>

          <div>
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[.12em] text-[var(--accent)]">
                  Результаты
                </p>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">
                  Созданные, улучшенные и экспортированные материалы.
                </p>
              </div>
              <span className="text-xs text-[var(--text-secondary)]">{results.length}</span>
            </div>
            {renderCards(results, 'result')}
          </div>
        </div>
      )}
    </section>
  );
}

