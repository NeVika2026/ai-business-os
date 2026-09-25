'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, useTransition } from 'react';

import {
  getMediaGenerationStatusAction,
  startUpscaleAction,
  type MediaStudioStatusResult,
} from '@/app/(dashboard)/modules/create/studio/actions';
import { saveFactoryArtifactAction } from '@/app/(dashboard)/modules/factory-chain/actions';
import { MediaUploadField } from '@/components/media/MediaUploadField';

type Kind = 'image' | 'video';

type Props = {
  initialKind: Kind;
  projectId?: string | null;
};

function pendingStatus(): MediaStudioStatusResult {
  return {
    status: 'pending',
    providerStatus: 'pending',
    outputUrl: null,
    outputUrls: [],
    ephemeral: false,
  };
}

export function UpscaleStudio({ initialKind, projectId = null }: Props) {
  const [kind, setKind] = useState<Kind>(initialKind);
  const [sourceUrl, setSourceUrl] = useState('');
  const [approved, setApproved] = useState(false);
  const [scaleFactor, setScaleFactor] = useState<2 | 4 | 8 | 16>(2);
  const [resolution, setResolution] = useState<'720p' | '1k' | '2k' | '4k'>('2k');
  const [activeProjectId, setActiveProjectId] = useState<string | null>(projectId);
  const [jobId, setJobId] = useState('');
  const [status, setStatus] = useState<MediaStudioStatusResult | null>(null);
  const [message, setMessage] = useState('');
  const [isStarting, startTransition] = useTransition();
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedRef = useRef('');

  const busy = isStarting || status?.status === 'pending' || status?.status === 'running';

  useEffect(() => {
    if (!jobId || !status) return;
    if (status.status === 'completed' || status.status === 'failed') return;

    pollRef.current = setTimeout(async () => {
      const next = await getMediaGenerationStatusAction(kind, jobId, activeProjectId);
      setStatus(next);
    }, 3500);

    return () => {
      if (pollRef.current) clearTimeout(pollRef.current);
    };
  }, [activeProjectId, jobId, kind, status]);

  useEffect(() => {
    if (
      !activeProjectId ||
      status?.status !== 'completed' ||
      !status.outputUrl ||
      savedRef.current === status.outputUrl
    ) {
      return;
    }

    savedRef.current = status.outputUrl;

    void saveFactoryArtifactAction({
      projectId: activeProjectId,
      stage: 'create',
      title: kind === 'image' ? 'Изображение улучшено' : 'Видео улучшено',
      content: status.outputUrl,
      metadata: {
        artifactType: kind === 'image' ? 'image-upscale' : 'video-upscale',
        provider: 'runway',
        outputUrl: status.outputUrl,
        outputUrls: status.outputUrls,
        storagePath: status.storagePath ?? null,
        sourceUrl,
      },
    });
  }, [activeProjectId, kind, sourceUrl, status]);

  const start = () => {
    if (!sourceUrl.trim() || !approved || busy) return;

    setMessage('');
    setStatus(null);
    setJobId('');

    startTransition(async () => {
      const result = await startUpscaleAction({
        kind,
        sourceUrl,
        approved,
        projectId: activeProjectId,
        scaleFactor,
        resolution,
        flavor: kind === 'image' ? 'photo' : 'photo',
      });

      if (result.status !== 'started') {
        setMessage(result.message);
        return;
      }

      setActiveProjectId(result.projectId);
      setJobId(result.id);
      setStatus(pendingStatus());
      setMessage('Улучшение запущено. Результат появится автоматически.');
    });
  };

  return (
    <main className="mx-auto w-full max-w-[1320px] pb-16 text-[#f7f2e8]">
      <section className="rounded-[34px] border border-white/[0.09] bg-[linear-gradient(145deg,#05070b,#0b1018_58%,#06080c)] p-6 sm:p-8">
        <p className="text-[12px] font-black uppercase tracking-[.18em] text-[#79eaf2]">
          БИЗНЕС-ЗАВОД · УЛУЧШЕНИЕ КАЧЕСТВА
        </p>
        <h1 className="mt-3 text-[clamp(2.8rem,5vw,5.2rem)] font-black leading-[.94] tracking-[-.055em] text-[#fff8e7]">
          Поднять качество.
          <span className="block text-[#f1c96c]">Фото и видео.</span>
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-white/58">
          Увеличение разрешения без пересборки исходного контента.
        </p>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[.78fr_1.22fr]">
        <div className="rounded-[28px] border border-white/[0.08] bg-[#080c12] p-5 sm:p-6">
          <div className="grid grid-cols-2 gap-2">
            {[
              ['image', 'Фото'],
              ['video', 'Видео'],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setKind(id as Kind);
                  setStatus(null);
                  setJobId('');
                  setMessage('');
                  setApproved(false);
                }}
                className={[
                  'rounded-[16px] border px-4 py-3 text-sm font-black transition',
                  kind === id
                    ? 'border-[#69e4ee]/30 bg-[#69e4ee]/[0.07] text-[#c8fbff]'
                    : 'border-white/[0.08] bg-white/[0.02] text-white/56',
                ].join(' ')}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-5">
            <MediaUploadField
              expectedKind={kind}
              accept={kind === 'image' ? 'image/png,image/jpeg,image/webp' : 'video/mp4,video/webm'}
              projectId={activeProjectId}
              autoCreateProject
              projectSeed={kind === 'image' ? 'Улучшение изображения' : 'Улучшение видео'}
              onProjectReady={setActiveProjectId}
              label={kind === 'image' ? 'Загрузить фото с устройства' : 'Загрузить видео с устройства'}
              onUploaded={({ url }) => setSourceUrl(url)}
            />
          </div>

          <label className="mt-4 grid gap-2">
            <span className="text-sm font-bold text-white/72">Или вставьте ссылку</span>
            <input
              value={sourceUrl}
              onChange={(event) => setSourceUrl(event.target.value)}
              placeholder="https://…"
              className="rounded-[16px] border border-white/[0.09] bg-black/25 px-4 py-3.5 text-sm text-white outline-none"
            />
          </label>

          {kind === 'image' ? (
            <label className="mt-4 grid gap-2">
              <span className="text-sm font-bold text-white/72">Увеличение</span>
              <select
                value={scaleFactor}
                onChange={(event) => setScaleFactor(Number(event.target.value) as 2 | 4 | 8 | 16)}
                className="rounded-[16px] border border-white/[0.09] bg-black/25 px-4 py-3.5 text-sm text-white outline-none"
              >
                <option value={2}>2×</option>
                <option value={4}>4×</option>
                <option value={8}>8×</option>
                <option value={16}>16×</option>
              </select>
            </label>
          ) : (
            <label className="mt-4 grid gap-2">
              <span className="text-sm font-bold text-white/72">Итоговое качество</span>
              <select
                value={resolution}
                onChange={(event) => setResolution(event.target.value as '720p' | '1k' | '2k' | '4k')}
                className="rounded-[16px] border border-white/[0.09] bg-black/25 px-4 py-3.5 text-sm text-white outline-none"
              >
                <option value="720p">720p</option>
                <option value="1k">1K</option>
                <option value="2k">2K</option>
                <option value="4k">4K</option>
              </select>
            </label>
          )}

          <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-[18px] border border-[#f1c96c]/13 bg-[#f1c96c]/[0.035] p-4">
            <input
              type="checkbox"
              checked={approved}
              onChange={(event) => setApproved(event.target.checked)}
              className="mt-1 h-4 w-4"
            />
            <span className="text-sm leading-6 text-white/62">
              Подтверждаю платную AI-обработку и возможное списание кредитов.
            </span>
          </label>

          <button
            type="button"
            disabled={!approved || !sourceUrl.trim() || busy}
            onClick={start}
            className="mt-5 w-full rounded-[18px] bg-[linear-gradient(135deg,#ffe08a,#d79a30)] px-5 py-4 text-sm font-black text-[#1b1105] disabled:cursor-not-allowed disabled:opacity-35"
          >
            {busy ? 'Улучшаю…' : 'Улучшить качество →'}
          </button>

          {message ? (
            <p className="mt-4 rounded-2xl border border-white/[0.07] bg-white/[0.02] px-4 py-3 text-sm leading-6 text-white/66">
              {message}
            </p>
          ) : null}
        </div>

        <div className="rounded-[28px] border border-white/[0.08] bg-[#080c12] p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[12px] font-black uppercase tracking-[.14em] text-[#79eaf2]">РЕЗУЛЬТАТ</p>
              <h2 className="mt-2 text-2xl font-black text-[#fff8e7]">Улучшенный файл</h2>
            </div>
            {activeProjectId ? (
              <Link
                href={'/projects/' + activeProjectId}
                className="rounded-xl border border-white/[0.09] px-3 py-2 text-xs font-black text-white/62"
              >
                Проект →
              </Link>
            ) : null}
          </div>

          {!status ? (
            <div className="flex min-h-[560px] items-center justify-center text-center text-white/40">
              Загрузите исходный файл и запустите улучшение качества.
            </div>
          ) : status.status === 'completed' && status.outputUrl ? (
            <div className="mt-5">
              {kind === 'image' ? (
                <img src={status.outputUrl} alt="" className="max-h-[650px] w-full rounded-[20px] bg-black object-contain" />
              ) : (
                <video src={status.outputUrl} controls playsInline className="max-h-[650px] w-full rounded-[20px] bg-black object-contain" />
              )}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs font-black text-emerald-200/82">ГОТОВО</span>
                <a
                  href={status.outputUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl border border-[#69e4ee]/16 px-3 py-2 text-xs font-black text-[#a8f3f8]"
                >
                  Открыть результат ↗
                </a>
              </div>
            </div>
          ) : status.status === 'failed' ? (
            <div className="flex min-h-[560px] items-center justify-center text-center text-red-100/70">
              Не удалось улучшить файл.
            </div>
          ) : (
            <div className="flex min-h-[560px] items-center justify-center text-center">
              <div>
                <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-white/[0.08] border-t-[#69e4ee]" />
                <p className="mt-4 text-sm font-black text-[#dffbff]">AI улучшает качество</p>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
