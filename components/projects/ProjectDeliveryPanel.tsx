'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import type { FactoryArtifact } from '@/lib/factory-chain/persistence';
import type { ProjectMediaItem } from '@/utils/projects/project-media-loader';

type Props = {
  projectId: string;
  artifacts: FactoryArtifact[];
  media: ProjectMediaItem[];
};

function artifactType(artifact: FactoryArtifact) {
  const value = artifact.metadata?.artifactType;
  return typeof value === 'string' ? value : '';
}

function isQaArtifact(artifact: FactoryArtifact) {
  return artifactType(artifact) === 'campaign-qa';
}

function downloadableName(title: string) {
  return (
    title
      .trim()
      .toLowerCase()
      .replace(/ё/g, 'е')
      .replace(/[^a-zа-я0-9]+/gi, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'result'
  );
}

export function ProjectDeliveryPanel({ projectId, artifacts, media }: Props) {
  const [copiedId, setCopiedId] = useState('');

  const qa = useMemo(() => artifacts.find(isQaArtifact) ?? null, [artifacts]);
  const qaReady = Boolean(
    qa?.content.toUpperCase().includes('ПАКЕТ ГОТОВ К ВЫПУСКУ'),
  );

  const deliverables = useMemo(
    () =>
      artifacts.filter((artifact) => {
        const type = artifactType(artifact);
        return (
          type &&
          type !== 'campaign-strategy' &&
          type !== 'campaign-qa' &&
          !type.includes('snapshot')
        );
      }),
    [artifacts],
  );

  const copyText = async (artifact: FactoryArtifact) => {
    try {
      await navigator.clipboard.writeText(artifact.content);
      setCopiedId(artifact.id);
      window.setTimeout(() => setCopiedId(''), 1400);
    } catch {
      setCopiedId('');
    }
  };

  const downloadText = (artifact: FactoryArtifact) => {
    const blob = new Blob([artifact.content], {
      type: 'text/plain;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = downloadableName(artifact.title) + '.txt';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  if (!artifacts.length && !media.length) return null;

  return (
    <section className="overflow-hidden rounded-[30px] border border-[#f1c96c]/14 bg-[linear-gradient(145deg,#070a0f,#0b1017_60%,#080b10)] p-5 text-[#f7f2e8] sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[.18em] text-[#f1c96c]">
            ГОТОВЫЙ КОМПЛЕКТ
          </p>
          <h2 className="mt-2 text-3xl font-black tracking-[-.04em] text-[#fff8e7]">
            Всё по проекту — в одном месте
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/48">
            Тексты, медиа, контроль качества и выпуск. Ничего не нужно искать по разным разделам.
          </p>
        </div>

        <span
          className={[
            'rounded-full border px-3 py-2 text-[10px] font-black uppercase tracking-[.12em]',
            qaReady
              ? 'border-emerald-300/20 bg-emerald-300/[0.06] text-emerald-200'
              : qa
                ? 'border-amber-300/20 bg-amber-300/[0.05] text-amber-100/80'
                : 'border-white/[0.08] bg-white/[0.025] text-white/38',
          ].join(' ')}
        >
          {qaReady ? 'ПАКЕТ ГОТОВ' : qa ? 'ЕСТЬ ЗАМЕЧАНИЯ QA' : 'QA ЕЩЁ НЕ ЗАПУЩЕН'}
        </span>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Link
          href={'/modules/factory?project=' + encodeURIComponent(projectId)}
          className="rounded-xl bg-[linear-gradient(135deg,#ffe08a,#d79a30)] px-4 py-3 text-xs font-black text-[#1b1105]"
        >
          Открыть автомаршрут →
        </Link>
        <Link
          href={'/modules/publish/studio?project=' + encodeURIComponent(projectId)}
          className="rounded-xl border border-[#69e4ee]/18 bg-[#69e4ee]/[0.04] px-4 py-3 text-xs font-black text-[#a8f3f8]"
        >
          К публикации →
        </Link>
        <Link
          href={'/media?project=' + encodeURIComponent(projectId)}
          className="rounded-xl border border-white/[0.09] px-4 py-3 text-xs font-black text-white/62"
        >
          Вся медиатека →
        </Link>
      </div>

      {qa ? (
        <div className="mt-5 rounded-[20px] border border-white/[0.07] bg-black/20 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-black text-[#fff8e7]">Контроль качества</p>
            <span className="text-[10px] font-bold text-white/36">последняя проверка</span>
          </div>
          <p className="mt-3 max-h-[180px] overflow-auto whitespace-pre-wrap text-xs leading-6 text-white/58">
            {qa.content}
          </p>
        </div>
      ) : null}

      {deliverables.length ? (
        <div className="mt-5">
          <p className="text-[11px] font-black uppercase tracking-[.14em] text-[#79eaf2]">
            ТЕКСТЫ И МАТЕРИАЛЫ
          </p>
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            {deliverables.slice(0, 8).map((artifact) => (
              <article
                key={artifact.id}
                className="rounded-[20px] border border-white/[0.07] bg-white/[0.025] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-[#fff8e7]">
                      {artifact.title}
                    </p>
                    <p className="mt-1 text-[10px] uppercase tracking-[.1em] text-white/28">
                      {artifactType(artifact) || 'материал'}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full border border-emerald-300/12 bg-emerald-300/[0.04] px-2 py-1 text-[9px] font-black text-emerald-200/75">
                    ГОТОВО
                  </span>
                </div>

                <p className="mt-3 max-h-[145px] overflow-hidden whitespace-pre-wrap text-xs leading-6 text-white/55">
                  {artifact.content}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => copyText(artifact)}
                    className="rounded-xl border border-white/[0.09] px-3 py-2 text-[10px] font-black text-white/62"
                  >
                    {copiedId === artifact.id ? 'Скопировано ✓' : 'Скопировать'}
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadText(artifact)}
                    className="rounded-xl border border-white/[0.09] px-3 py-2 text-[10px] font-black text-white/62"
                  >
                    Скачать .txt
                  </button>
                  {['social-post', 'telegram-post', 'stories', 'campaign-document'].includes(
                    artifactType(artifact),
                  ) ? (
                    <Link
                      href={
                        '/modules/publish/studio?project=' +
                        encodeURIComponent(projectId) +
                        '&artifact=' +
                        encodeURIComponent(artifact.id)
                      }
                      className="rounded-xl border border-[#69e4ee]/16 px-3 py-2 text-[10px] font-black text-[#a8f3f8]"
                    >
                      Публикация →
                    </Link>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : null}

      {media.length ? (
        <div className="mt-5">
          <div className="flex items-end justify-between gap-3">
            <p className="text-[11px] font-black uppercase tracking-[.14em] text-[#79eaf2]">
              МЕДИА ПРОЕКТА
            </p>
            <Link
              href={'/media?project=' + encodeURIComponent(projectId)}
              className="text-[10px] font-black text-[#a8f3f8]"
            >
              Показать все →
            </Link>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {media.slice(0, 4).map((item) => (
              <article
                key={item.id}
                className="overflow-hidden rounded-[18px] border border-white/[0.07] bg-black/20"
              >
                <div className="flex aspect-video items-center justify-center bg-black/35">
                  {item.kind === 'image' && item.signedUrl ? (
                    <img src={item.signedUrl} alt="" className="h-full w-full object-cover" />
                  ) : item.kind === 'video' && item.signedUrl ? (
                    <video
                      src={item.signedUrl}
                      muted
                      playsInline
                      preload="metadata"
                      className="h-full w-full object-cover"
                    />
                  ) : item.kind === 'audio' ? (
                    <span className="text-4xl text-[#f1c96c]">♪</span>
                  ) : (
                    <span className="text-3xl text-white/20">◫</span>
                  )}
                </div>
                <div className="p-3">
                  <p className="truncate text-xs font-black text-[#fff8e7]">{item.title}</p>
                  {item.kind === 'audio' && item.signedUrl ? (
                    <audio className="mt-3 h-8 w-full" controls preload="none" src={item.signedUrl} />
                  ) : item.signedUrl ? (
                    <a
                      href={item.signedUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex text-[10px] font-black text-[#a8f3f8]"
                    >
                      Открыть файл ↗
                    </a>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
