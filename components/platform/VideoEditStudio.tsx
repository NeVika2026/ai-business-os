'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, useTransition } from 'react';

import {
  getMediaGenerationStatusAction,
  startVideoEditAction,
  type MediaStudioStatusResult,
  type VideoEditMode,
} from '@/app/(dashboard)/modules/create/studio/actions';
import { saveFactoryArtifactAction } from '@/app/(dashboard)/modules/factory-chain/actions';
import { MediaUploadField } from '@/components/media/MediaUploadField';

type Props = {
  initialMode: VideoEditMode;
  projectId?: string | null;
  initialSourceUrl?: string;
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

export function VideoEditStudio({ initialMode, projectId = null, initialSourceUrl = '' }: Props) {
  const [mode, setMode] = useState<VideoEditMode>(initialMode);
  const [sourceUrl, setSourceUrl] = useState(initialSourceUrl);
  const [promptText, setPromptText] = useState('');
  const [targetAspectRatio, setTargetAspectRatio] = useState<'16:9' | '9:16' | '1:1' | '4:3' | '3:4' | '21:9' | '2:3' | '3:2'>('9:16');
  const [approved, setApproved] = useState(false);
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
      const next = await getMediaGenerationStatusAction('video', jobId, activeProjectId);
      setStatus(next);
      if (next.status === 'failed') {
        setMessage('Редактирование завершилось с ошибкой: ' + next.providerStatus);
      }
    }, 3500);

    return () => {
      if (pollRef.current) clearTimeout(pollRef.current);
    };
  }, [activeProjectId, jobId, status]);

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
      title: mode === 'edit' ? 'Видео отредактировано' : 'Видео расширено',
      content: status.outputUrl,
      metadata: {
        artifactType: mode === 'edit' ? 'video-edit' : 'video-expand',
        provider: 'runway',
        outputUrl: status.outputUrl,
        outputUrls: status.outputUrls,
        storagePath: status.storagePath ?? null,
        sourceUrl,
        promptText,
        targetAspectRatio: mode === 'expand' ? targetAspectRatio : null,
      },
    });
  }, [activeProjectId, mode, promptText, sourceUrl, status, targetAspectRatio]);

  const start = () => {
    if (!sourceUrl.trim() || !approved || busy) return;

    if (mode === 'edit' && !promptText.trim()) {
      setMessage('Опишите, что нужно изменить.');
      return;
    }

    setMessage('');
    setStatus(null);
    setJobId('');

    startTransition(async () => {
      const result = await startVideoEditAction({
        mode,
        sourceUrl,
        promptText,
        targetAspectRatio,
        approved,
        projectId: activeProjectId,
      });

      if (result.status !== 'started') {
        setMessage(result.message);
        return;
      }

      setActiveProjectId(result.projectId);
      setJobId(result.id);
      setStatus(pendingStatus());
      setMessage('Редактирование запущено. Результат появится автоматически.');
    });
  };

  return (
    <main className="mx-auto w-full max-w-[1320px] pb-16 text-[#f7f2e8]">
      <section className="rounded-[34px] border border-white/[0.09] bg-[linear-gradient(145deg,#05070b,#0b1018_58%,#06080c)] p-6 sm:p-8">
        <p className="text-[12px] font-black uppercase tracking-[.18em] text-[#79eaf2]">БИЗНЕС-ЗАВОД · РЕДАКТОР ВИДЕО</p>
        <h1 className="mt-3 text-[clamp(2.8rem,5vw,5.2rem)] font-black leading-[.94] tracking-[-.055em] text-[#fff8e7]">
          Меняем только нужное.
          <span className="block text-[#f1c96c]">Остальное сохраняем.</span>
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-white/58">
          Точечное редактирование существующего ролика или расширение кадра под новый формат без обычного crop.
        </p>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[.78fr_1.22fr]">
        <div className="rounded-[28px] border border-white/[0.08] bg-[#080c12] p-5 sm:p-6">
          <div className="grid grid-cols-2 gap-2">
            {[
              ['edit', 'Изменить видео'],
              ['expand', 'Расширить кадр'],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setMode(id as VideoEditMode);
                  setStatus(null);
                  setJobId('');
                  setMessage('');
                  setApproved(false);
                }}
                className={[
                  'rounded-[16px] border px-4 py-3 text-sm font-black transition',
                  mode === id
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
              expectedKind="video"
              accept="video/mp4,video/webm"
              projectId={activeProjectId}
              autoCreateProject
              projectSeed="Редактирование видео"
              onProjectReady={setActiveProjectId}
              label="Загрузить видео с устройства"
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

          {mode === 'edit' ? (
            <label className="mt-4 grid gap-2">
              <span className="text-sm font-bold text-white/72">Что изменить</span>
              <textarea
                rows={6}
                value={promptText}
                onChange={(event) => setPromptText(event.target.value)}
                placeholder="Например: замени цвет дивана на тёплый бежевый. Всё остальное в кадре оставь без изменений."
                className="resize-none rounded-[16px] border border-white/[0.09] bg-black/25 px-4 py-3.5 text-sm leading-6 text-white outline-none"
              />
            </label>
          ) : (
            <>
              <label className="mt-4 grid gap-2">
                <span className="text-sm font-bold text-white/72">Новый формат</span>
                <select
                  value={targetAspectRatio}
                  onChange={(event) => setTargetAspectRatio(event.target.value as typeof targetAspectRatio)}
                  className="rounded-[16px] border border-white/[0.09] bg-black/25 px-4 py-3.5 text-sm text-white outline-none"
                >
                  {['9:16','16:9','1:1','4:3','3:4','21:9','2:3','3:2'].map((value) => (
                    <option key={value} value={value}>{value}</option>
                  ))}
                </select>
              </label>
              <label className="mt-4 grid gap-2">
                <span className="text-sm font-bold text-white/72">Что дорисовать по краям — необязательно</span>
                <textarea
                  rows={4}
                  value={promptText}
                  onChange={(event) => setPromptText(event.target.value)}
                  placeholder="Если оставить пустым, AI продолжит существующую сцену."
                  className="resize-none rounded-[16px] border border-white/[0.09] bg-black/25 px-4 py-3.5 text-sm leading-6 text-white outline-none"
                />
              </label>
            </>
          )}

          <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-[18px] border border-[#f1c96c]/13 bg-[#f1c96c]/[0.035] p-4">
            <input type="checkbox" checked={approved} onChange={(event) => setApproved(event.target.checked)} className="mt-1 h-4 w-4" />
            <span className="text-sm leading-6 text-white/62">
              Подтверждаю платное редактирование видео и возможное списание кредитов.
            </span>
          </label>

          <button
            type="button"
            disabled={!approved || !sourceUrl.trim() || busy}
            onClick={start}
            className="mt-5 w-full rounded-[18px] bg-[linear-gradient(135deg,#ffe08a,#d79a30)] px-5 py-4 text-sm font-black text-[#1b1105] disabled:cursor-not-allowed disabled:opacity-35"
          >
            {busy ? 'Редактирую…' : mode === 'edit' ? 'Изменить видео →' : 'Расширить кадр →'}
          </button>

          {message ? (
            <p className="mt-4 rounded-2xl border border-white/[0.07] bg-white/[0.02] px-4 py-3 text-sm leading-6 text-white/66">{message}</p>
          ) : null}
        </div>

        <div className="rounded-[28px] border border-white/[0.08] bg-[#080c12] p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[12px] font-black uppercase tracking-[.14em] text-[#79eaf2]">РЕЗУЛЬТАТ</p>
              <h2 className="mt-2 text-2xl font-black text-[#fff8e7]">Готовый ролик</h2>
            </div>
            {activeProjectId ? (
              <Link href={'/projects/' + activeProjectId} className="rounded-xl border border-white/[0.09] px-3 py-2 text-xs font-black text-white/62">Проект →</Link>
            ) : null}
          </div>

          {!status ? (
            <div className="flex min-h-[560px] items-center justify-center text-center text-white/40">
              Загрузите исходный ролик и задайте изменение.
            </div>
          ) : status.status === 'completed' && status.outputUrl ? (
            <div className="mt-5">
              <video src={status.outputUrl} controls playsInline className="max-h-[650px] w-full rounded-[20px] bg-black object-contain" />
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs font-black text-emerald-200/82">ГОТОВО</span>
                <a href={status.outputUrl} target="_blank" rel="noreferrer" className="rounded-xl border border-[#69e4ee]/16 px-3 py-2 text-xs font-black text-[#a8f3f8]">Открыть результат ↗</a>
              </div>
            </div>
          ) : status.status === 'failed' ? (
            <div className="flex min-h-[560px] items-center justify-center text-center text-red-100/70">Не удалось отредактировать видео.</div>
          ) : (
            <div className="flex min-h-[560px] items-center justify-center text-center">
              <div>
                <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-white/[0.08] border-t-[#69e4ee]" />
                <p className="mt-4 text-sm font-black text-[#dffbff]">AI редактирует ролик</p>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
