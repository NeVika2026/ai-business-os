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

export function ProjectMedia({ projectId, media }: ProjectMediaProps) {
  return (
    <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4 sm:p-5">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Медиа проекта</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {media.length} последних файлов
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
            Все медиа
          </Link>
        </div>
      </header>

      {media.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border-subtle)] bg-[var(--surface-0)] p-5">
          <p className="text-sm font-medium text-[var(--text-primary)]">
            К проекту пока не привязано медиа
          </p>
          <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">
            Создайте ролик, изображение или озвучку и сохраните файл в Медиатеку.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {media.map((item) => (
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
                <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                  {item.title}
                </p>
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
                  <a
                    href={item.signedUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex text-[10px] font-semibold text-[var(--accent)]"
                  >
                    Открыть ↗
                  </a>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
