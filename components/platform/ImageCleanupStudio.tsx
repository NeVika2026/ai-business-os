'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, useTransition } from 'react';

import {
  ensureMediaProjectAction,
  getMediaGenerationStatusAction,
  startMediaGenerationAction,
  type MediaStudioStatusResult,
} from '@/app/(dashboard)/modules/create/studio/actions';
import { saveFactoryArtifactAction } from '@/app/(dashboard)/modules/factory-chain/actions';
import { MediaUploadField } from '@/components/media/MediaUploadField';

type CleanupMode = 'remove-bg' | 'object-remove';

type Props = {
  initialMode: CleanupMode;
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

export function ImageCleanupStudio({ initialMode, projectId = null }: Props) {
  const [mode, setMode] = useState<CleanupMode>(initialMode);
  const [imageUrl, setImageUrl] = useState('');
  const [objectText, setObjectText] = useState('');
  const [approved, setApproved] = useState(false);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(projectId);
  const [jobId, setJobId] = useState('');
  const [status, setStatus] = useState<MediaStudioStatusResult | null>(null);
  const [message, setMessage] = useState('');
  const [isStarting, startTransition] = useTransition();
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedRef = useRef('');

  const busy =
    isStarting ||
    status?.status === 'pending' ||
    status?.status === 'running';

  useEffect(() => {
    if (!jobId || !status) return;
    if (status.status === 'completed' || status.status === 'failed') return;

    pollRef.current = setTimeout(async () => {
      const next = await getMediaGenerationStatusAction('image', jobId, activeProjectId);
      setStatus(next);
      if (next.status === 'failed') {
        setMessage('Обработка завершилась с ошибкой: ' + next.providerStatus);
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
      title: mode === 'remove-bg' ? 'Фон удалён' : 'Объект удалён',
      content: status.outputUrl,
      metadata: {
        artifactType: mode,
        provider: 'runway',
        outputUrl: status.outputUrl,
        outputUrls: status.outputUrls,
        storagePath: status.storagePath ?? null,
        providerStatus: status.providerStatus,
        sourceImageUrl: imageUrl,
      },
    });
  }, [activeProjectId, imageUrl, mode, status]);

  const start = () => {
    const source = imageUrl.trim();
    if (!source || busy || !approved) return;

    if (mode === 'object-remove' && !objectText.trim()) {
      setMessage('Опишите, что нужно удалить.');
      return;
    }

    setMessage('');
    setJobId('');
    setStatus(null);

    const promptText =
      mode === 'remove-bg'
        ? 'Используй исходное изображение как точный референс. Удали весь фон, сохрани основной объект без изменений, без деформации, без изменения цвета, формы, пропорций и деталей. Сделай чистый нейтральный фон, пригодный для рекламы и карточки товара.'
        : 'Используй исходное изображение как точный референс. Удали только указанный объект: ' +
          objectText.trim() +
          '. Восстанови фон естественно. Не меняй остальные предметы, геометрию, освещение, цвета и композицию.';

    startTransition(async () => {
      const project = await ensureMediaProjectAction(
        mode === 'remove-bg' ? 'Удаление фона' : 'Удаление объекта',
        activeProjectId,
      );
      const currentProjectId = project.projectId;
      setActiveProjectId(currentProjectId);

      const result = await startMediaGenerationAction({
        kind: 'image',
        promptText,
        approved,
        imageUrl: source,
        ratio: '1080:1920',
        projectId: currentProjectId,
      });

      if (result.status !== 'started') {
        setMessage(result.message);
        return;
      }

      setJobId(result.id);
      setStatus(pendingStatus());
      setMessage('Обработка запущена. Результат появится автоматически.');
    });
  };

  return (
    <main className="mx-auto w-full max-w-[1320px] pb-16 text-[#f7f2e8]">
      <section className="overflow-hidden rounded-[34px] border border-white/[0.09] bg-[linear-gradient(145deg,#05070b,#0b1018_58%,#06080c)] p-6 sm:p-8">
        <p className="text-[12px] font-black uppercase tracking-[.18em] text-[#79eaf2]">
          БИЗНЕС-ЗАВОД · ОЧИСТКА ИЗОБРАЖЕНИЯ
        </p>
        <h1 className="mt-3 text-[clamp(2.8rem,5vw,5.2rem)] font-black leading-[.94] tracking-[-.055em] text-[#fff8e7]">
          Чистим изображение.
          <span className="block text-[#f1c96c]">Без ручной ретуши.</span>
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-white/58">
          Удаление фона и лишних объектов работает через реальный image-edit поток и сохраняет результат в проект.
        </p>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[.78fr_1.22fr]">
        <div className="rounded-[28px] border border-white/[0.08] bg-[#080c12] p-5 sm:p-6">
          <div className="grid grid-cols-2 gap-2">
            {[
              ['remove-bg', 'Удалить фон'],
              ['object-remove', 'Удалить объект'],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setMode(id as CleanupMode);
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
              expectedKind="image"
              accept="image/png,image/jpeg,image/webp"
              projectId={activeProjectId}
              label="Загрузить изображение с устройства"
              onUploaded={({ url }) => setImageUrl(url)}
            />
          </div>

          <label className="mt-4 grid gap-2">
            <span className="text-sm font-bold text-white/72">Или вставьте ссылку</span>
            <input
              value={imageUrl}
              onChange={(event) => setImageUrl(event.target.value)}
              placeholder="https://…"
              className="rounded-[16px] border border-white/[0.09] bg-black/25 px-4 py-3.5 text-sm text-white outline-none"
            />
          </label>

          {mode === 'object-remove' ? (
            <label className="mt-4 grid gap-2">
              <span className="text-sm font-bold text-white/72">Что убрать</span>
              <textarea
                rows={4}
                value={objectText}
                onChange={(event) => setObjectText(event.target.value)}
                placeholder="Например: красный стул справа у стены"
                className="resize-none rounded-[16px] border border-white/[0.09] bg-black/25 px-4 py-3.5 text-sm leading-6 text-white outline-none"
              />
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
              Подтверждаю платную AI-обработку и возможное списание кредитов.
            </span>
          </label>

          <button
            type="button"
            disabled={!approved || !imageUrl.trim() || busy}
            onClick={start}
            className="mt-5 w-full rounded-[18px] bg-[linear-gradient(135deg,#ffe08a,#d79a30)] px-5 py-4 text-sm font-black text-[#1b1105] disabled:cursor-not-allowed disabled:opacity-35"
          >
            {busy ? 'Обрабатываю…' : mode === 'remove-bg' ? 'Удалить фон →' : 'Удалить объект →'}
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
              <h2 className="mt-2 text-2xl font-black text-[#fff8e7]">Готовое изображение</h2>
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
              Загрузите изображение или вставьте ссылку и запустите обработку.
            </div>
          ) : status.status === 'completed' && status.outputUrl ? (
            <div className="mt-5">
              <img
                src={status.outputUrl}
                alt="Результат обработки"
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
              Не удалось обработать изображение.
            </div>
          ) : (
            <div className="flex min-h-[560px] items-center justify-center text-center">
              <div>
                <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-white/[0.08] border-t-[#69e4ee]" />
                <p className="mt-4 text-sm font-black text-[#dffbff]">AI обрабатывает изображение</p>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
