'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, useTransition } from 'react';

import {
  getMediaGenerationStatusAction,
  startVideoMotionAction,
  type MediaStudioStatusResult,
  type VideoMotionMode,
} from '@/app/(dashboard)/modules/create/studio/actions';
import { saveFactoryArtifactAction } from '@/app/(dashboard)/modules/factory-chain/actions';

type Props = {
  initialMode: VideoMotionMode;
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

export function VideoMotionStudio({ initialMode, projectId = null }: Props) {
  const [mode, setMode] = useState<VideoMotionMode>(initialMode);
  const [sourceUrl, setSourceUrl] = useState('');
  const [promptText, setPromptText] = useState('');
  const [referenceImage, setReferenceImage] = useState('');
  const [duration, setDuration] = useState(8);
  const [ratio, setRatio] = useState('720:1280');
  const [audio, setAudio] = useState(true);
  const [approved, setApproved] = useState(false);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(projectId);
  const [jobId, setJobId] = useState('');
  const [status, setStatus] = useState<MediaStudioStatusResult | null>(null);
  const [message, setMessage] = useState('');
  const [isStarting, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saved = useRef('');

  const busy = isStarting || status?.status === 'pending' || status?.status === 'running';

  useEffect(() => {
    if (!jobId || !status) return;
    if (status.status === 'completed' || status.status === 'failed') return;

    timer.current = setTimeout(async () => {
      const next = await getMediaGenerationStatusAction('video', jobId, activeProjectId);
      setStatus(next);
      if (next.status === 'failed') {
        setMessage('Обработка завершилась с ошибкой: ' + next.providerStatus);
      }
    }, 3500);

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [activeProjectId, jobId, status]);

  useEffect(() => {
    if (
      !activeProjectId ||
      status?.status !== 'completed' ||
      !status.outputUrl ||
      saved.current === status.outputUrl
    ) {
      return;
    }

    saved.current = status.outputUrl;

    void saveFactoryArtifactAction({
      projectId: activeProjectId,
      stage: 'create',
      title: mode === 'extend' ? 'Видео продлено' : 'Движение перенесено',
      content: status.outputUrl,
      metadata: {
        artifactType: mode === 'extend' ? 'video-extend' : 'motion-transfer',
        provider: 'runway',
        outputUrl: status.outputUrl,
        outputUrls: status.outputUrls,
        storagePath: status.storagePath ?? null,
        sourceUrl,
        promptText,
        referenceImage: mode === 'motion' ? referenceImage || null : null,
        duration,
        ratio: mode === 'motion' ? ratio : null,
        audio,
      },
    });
  }, [
    activeProjectId,
    audio,
    duration,
    mode,
    promptText,
    ratio,
    referenceImage,
    sourceUrl,
    status,
  ]);

  const run = () => {
    if (!approved || !sourceUrl.trim() || !promptText.trim() || busy) return;

    setMessage('');
    setStatus(null);
    setJobId('');

    startTransition(async () => {
      const result = await startVideoMotionAction({
        mode,
        sourceUrl,
        promptText,
        referenceImage,
        duration,
        ratio,
        audio,
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
      setMessage(
        mode === 'extend'
          ? 'Продление запущено. Результат появится автоматически.'
          : 'Перенос движения запущен. Результат появится автоматически.',
      );
    });
  };

  return (
    <main className="mx-auto w-full max-w-[1320px] pb-16 text-[#f7f2e8]">
      <section className="rounded-[34px] border border-white/[0.09] bg-[linear-gradient(145deg,#05070b,#0b1018_58%,#06080c)] p-6 sm:p-8">
        <p className="text-[12px] font-black uppercase tracking-[.18em] text-[#79eaf2]">
          БИЗНЕС-ЗАВОД · VIDEO MOTION
        </p>
        <h1 className="mt-3 text-[clamp(2.8rem,5vw,5.2rem)] font-black leading-[.94] tracking-[-.055em] text-[#fff8e7]">
          Продлить ролик.
          <span className="block text-[#f1c96c]">Или забрать его движение.</span>
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-white/58">
          Продолжите существующую сцену новыми кадрами либо используйте исходный ролик как движение и структуру для новой версии.
        </p>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[.78fr_1.22fr]">
        <div className="rounded-[28px] border border-white/[0.08] bg-[#080c12] p-5 sm:p-6">
          <div className="grid grid-cols-2 gap-2">
            {([
              ['extend', 'Продлить видео'],
              ['motion', 'Перенести движение'],
            ] as const).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setMode(id);
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

          <label className="mt-5 grid gap-2">
            <span className="text-sm font-bold text-white/72">
              {mode === 'extend' ? 'Исходный ролик' : 'Ролик с нужным движением'}
            </span>
            <input
              value={sourceUrl}
              onChange={(event) => setSourceUrl(event.target.value)}
              placeholder="https://…mp4"
              className="rounded-[16px] border border-white/[0.09] bg-black/25 px-4 py-3.5 text-sm text-white outline-none"
            />
          </label>

          {mode === 'motion' ? (
            <label className="mt-4 grid gap-2">
              <span className="text-sm font-bold text-white/72">
                Изображение нового персонажа/объекта — необязательно
              </span>
              <input
                value={referenceImage}
                onChange={(event) => setReferenceImage(event.target.value)}
                placeholder="https://…jpg"
                className="rounded-[16px] border border-white/[0.09] bg-black/25 px-4 py-3.5 text-sm text-white outline-none"
              />
            </label>
          ) : null}

          <label className="mt-4 grid gap-2">
            <span className="text-sm font-bold text-white/72">
              {mode === 'extend' ? 'Как продолжить сцену' : 'Что должно получиться'}
            </span>
            <textarea
              rows={6}
              value={promptText}
              onChange={(event) => setPromptText(event.target.value)}
              placeholder={
                mode === 'extend'
                  ? 'Например: камера продолжает движение вперёд, герой открывает дверь и выходит на террасу; свет и стиль сохраняются.'
                  : 'Например: персонаж с референса повторяет движение из ролика; сохранить его лицо, одежду и пропорции.'
              }
              className="resize-none rounded-[16px] border border-white/[0.09] bg-black/25 px-4 py-3.5 text-sm leading-6 text-white outline-none"
            />
          </label>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-bold text-white/72">
                {mode === 'extend' ? 'Добавить' : 'Длительность'}
              </span>
              <select
                value={duration}
                onChange={(event) => setDuration(Number(event.target.value))}
                className="rounded-[16px] border border-white/[0.09] bg-black/25 px-4 py-3.5 text-sm text-white outline-none"
              >
                {[4, 5, 8, 10, 15, 20, 30].map((value) => (
                  <option key={value} value={value}>
                    {value} сек.
                  </option>
                ))}
              </select>
            </label>

            {mode === 'motion' ? (
              <label className="grid gap-2">
                <span className="text-sm font-bold text-white/72">Формат</span>
                <select
                  value={ratio}
                  onChange={(event) => setRatio(event.target.value)}
                  className="rounded-[16px] border border-white/[0.09] bg-black/25 px-4 py-3.5 text-sm text-white outline-none"
                >
                  <option value="720:1280">9:16</option>
                  <option value="1280:720">16:9</option>
                  <option value="960:960">1:1</option>
                  <option value="834:1112">3:4</option>
                  <option value="1112:834">4:3</option>
                </select>
              </label>
            ) : (
              <label className="flex items-center gap-3 rounded-[16px] border border-white/[0.09] bg-black/25 px-4 py-3.5">
                <input
                  type="checkbox"
                  checked={audio}
                  onChange={(event) => setAudio(event.target.checked)}
                />
                <span className="text-sm font-bold text-white/72">Генерировать звук</span>
              </label>
            )}
          </div>

          {mode === 'motion' ? (
            <label className="mt-4 flex items-center gap-3 rounded-[16px] border border-white/[0.09] bg-black/25 px-4 py-3.5">
              <input
                type="checkbox"
                checked={audio}
                onChange={(event) => setAudio(event.target.checked)}
              />
              <span className="text-sm font-bold text-white/72">Генерировать звук</span>
            </label>
          ) : null}

          <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-[18px] border border-[#f1c96c]/13 bg-[#f1c96c]/[0.035] p-4">
            <input
              type="checkbox"
              checked={approved}
              onChange={(event) => setApproved(event.target.checked)}
              className="mt-1 h-4 w-4"
            />
            <span className="text-sm leading-6 text-white/62">
              Подтверждаю платную AI-генерацию и возможное списание кредитов.
            </span>
          </label>

          <button
            type="button"
            disabled={!approved || !sourceUrl.trim() || !promptText.trim() || busy}
            onClick={run}
            className="mt-5 w-full rounded-[18px] bg-[linear-gradient(135deg,#ffe08a,#d79a30)] px-5 py-4 text-sm font-black text-[#1b1105] disabled:cursor-not-allowed disabled:opacity-35"
          >
            {busy
              ? 'Генерирую…'
              : mode === 'extend'
                ? 'Продлить видео →'
                : 'Перенести движение →'}
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
              <p className="text-[12px] font-black uppercase tracking-[.14em] text-[#79eaf2]">
                РЕЗУЛЬТАТ
              </p>
              <h2 className="mt-2 text-2xl font-black text-[#fff8e7]">Готовый ролик</h2>
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
              Добавьте исходный ролик и задайте результат.
            </div>
          ) : status.status === 'completed' && status.outputUrl ? (
            <div className="mt-5">
              <video
                src={status.outputUrl}
                controls
                playsInline
                className="max-h-[650px] w-full rounded-[20px] bg-black object-contain"
              />
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
              Не удалось создать ролик.
            </div>
          ) : (
            <div className="flex min-h-[560px] items-center justify-center text-center">
              <div>
                <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-white/[0.08] border-t-[#69e4ee]" />
                <p className="mt-4 text-sm font-black text-[#dffbff]">AI работает с движением</p>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
