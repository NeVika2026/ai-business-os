import Link from 'next/link';

import { loadRecentFactoryArtifacts } from '@/lib/factory-chain/persistence';
import { getPublishingConnectionStatusAction } from '@/app/(dashboard)/modules/publish/studio/actions';

const CHANNEL_LABELS: Record<string, string> = {
  telegram: 'Telegram',
  vk: 'ВКонтакте',
  youtube: 'YouTube',
  instagram: 'Instagram Reels',
  tiktok: 'TikTok',
  max: 'MAX',
  dzen: 'Дзен',
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function publicationId(metadata: Record<string, unknown>) {
  const fields = ['videoId', 'mediaId', 'publishId', 'postId', 'containerId'];
  for (const field of fields) {
    const value = metadata[field];
    if (typeof value === 'string' && value) return value;
    if (typeof value === 'number') return String(value);
  }

  const messageIds = metadata.messageIds;
  if (Array.isArray(messageIds) && messageIds.length) {
    return messageIds.map(String).join(', ');
  }

  return '';
}

export default async function PublishingHistoryPage() {
  const [artifacts, connections] = await Promise.all([
    loadRecentFactoryArtifacts(100),
    getPublishingConnectionStatusAction(),
  ]);

  const publications = artifacts.filter((artifact) => {
    if (artifact.stage !== 'publish') return false;
    const channel = artifact.metadata.channel;
    return typeof channel === 'string' && Boolean(channel);
  });

  const connected = Object.entries(connections)
    .filter(([, value]) => value)
    .map(([key]) => CHANNEL_LABELS[key] ?? key);

  return (
    <main className="mx-auto w-full max-w-[1320px] pb-16 text-[#f7f2e8]">
      <section className="rounded-[32px] border border-white/[0.08] bg-[#080c12] p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[.18em] text-[#79eaf2]">
              БИЗНЕС-ЗАВОД · ПУБЛИКАЦИИ
            </p>
            <h1 className="mt-3 text-[clamp(2.5rem,5vw,4.8rem)] font-black leading-[.95] tracking-[-.05em] text-[#fff8e7]">
              Журнал публикаций
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-white/55">
              Что уже отправлено, куда ушло и к какому проекту относится.
            </p>
          </div>

          <Link
            href="/modules/publish/studio"
            className="rounded-2xl bg-[linear-gradient(135deg,#ffe08a,#d79a30)] px-5 py-3 text-sm font-black text-[#1b1105]"
          >
            Открыть цех публикации →
          </Link>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {connected.length ? (
            connected.map((label) => (
              <span
                key={label}
                className="rounded-full border border-emerald-300/12 bg-emerald-300/[0.04] px-3 py-1.5 text-xs font-bold text-emerald-100/75"
              >
                {label} · подключено
              </span>
            ))
          ) : (
            <span className="text-xs text-white/38">Прямые каналы пока не подключены.</span>
          )}
        </div>
      </section>

      <section className="mt-5 rounded-[28px] border border-white/[0.08] bg-[#080c12] p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[.14em] text-[#79eaf2]">
              ИСТОРИЯ
            </p>
            <h2 className="mt-2 text-2xl font-black text-[#fff8e7]">
              Последние отправки
            </h2>
          </div>
          <span className="text-xs text-white/38">{publications.length} записей</span>
        </div>

        {publications.length === 0 ? (
          <div className="py-20 text-center text-sm text-white/40">
            После первой прямой публикации запись появится здесь автоматически.
          </div>
        ) : (
          <div className="mt-5 grid gap-3">
            {publications.map((artifact) => {
              const channel =
                typeof artifact.metadata.channel === 'string'
                  ? artifact.metadata.channel
                  : '';
              const id = publicationId(artifact.metadata);
              const mediaKind =
                typeof artifact.metadata.mediaKind === 'string'
                  ? artifact.metadata.mediaKind
                  : '';

              return (
                <article
                  key={artifact.id}
                  className="rounded-[20px] border border-white/[0.07] bg-white/[0.02] p-4 sm:p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-[#69e4ee]/15 bg-[#69e4ee]/[0.04] px-2.5 py-1 text-[10px] font-black uppercase tracking-[.1em] text-[#bff7fa]">
                          {CHANNEL_LABELS[channel] ?? channel}
                        </span>
                        <span className="text-[11px] text-white/34">
                          {formatDate(artifact.createdAt)}
                        </span>
                        {mediaKind ? (
                          <span className="text-[11px] text-white/34">
                            · {mediaKind === 'image' ? 'изображение' : mediaKind === 'video' ? 'видео' : 'аудио'}
                          </span>
                        ) : null}
                      </div>

                      <h3 className="mt-3 text-base font-black text-[#fff8e7]">
                        {artifact.title}
                      </h3>
                      <p className="mt-2 line-clamp-3 max-w-4xl whitespace-pre-wrap text-sm leading-6 text-white/54">
                        {artifact.content}
                      </p>

                      {id ? (
                        <p className="mt-3 break-all text-[10px] text-white/32">
                          ID: {id}
                        </p>
                      ) : null}
                    </div>

                    <Link
                      href={'/projects/' + artifact.projectId}
                      className="shrink-0 rounded-xl border border-white/[0.08] px-3 py-2 text-xs font-black text-white/58 hover:text-white"
                    >
                      Проект →
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
