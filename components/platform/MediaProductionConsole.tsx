'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import {
  generateCreateStudioArtifactAction,
  getMediaGenerationStatusAction,
  listMediaVoicesAction,
  startMediaGenerationAction,
  type MediaStudioKind,
  type MediaStudioStatusResult,
} from '@/app/(dashboard)/modules/create/studio/actions';
import {
  ensureFactoryProjectAction,
  saveFactoryArtifactAction,
} from '@/app/(dashboard)/modules/factory-chain/actions';
import type { CreateStudioModeId } from '@/utils/platform/create-studio';

type MediaProductionConsoleProps = {
  modeId: CreateStudioModeId;
  goal: string;
  format: string;
  context: string;
  projectId?: string | null;
};

type VoiceOption = {
  id: string;
  name: string;
  category: string;
  previewUrl: string | null;
};

const LIVE_MODES = new Set<CreateStudioModeId>(['video', 'image', 'voice']);

function toMediaKind(modeId: CreateStudioModeId): MediaStudioKind | null {
  if (modeId === 'video' || modeId === 'image' || modeId === 'voice') {
    return modeId;
  }

  return null;
}

function statusLabel(status: MediaStudioStatusResult['status'] | 'idle') {
  switch (status) {
    case 'pending':
      return 'В очереди';
    case 'running':
      return 'Генерируется';
    case 'completed':
      return 'Готово';
    case 'failed':
      return 'Ошибка';
    default:
      return 'Готов к запуску';
  }
}

function modeLabel(modeId: CreateStudioModeId) {
  if (modeId === 'video') return 'Видео';
  if (modeId === 'image') return 'Изображение';
  if (modeId === 'voice') return 'Озвучка';
  return 'Медиа';
}

export function MediaProductionConsole({
  modeId,
  goal,
  format,
  context,
  projectId = null,
}: MediaProductionConsoleProps) {
  const router = useRouter();
  const kind = toMediaKind(modeId);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(projectId);
  const [approved, setApproved] = useState(false);
  const [referenceImageUrl, setReferenceImageUrl] = useState('');
  const [duration, setDuration] = useState(5);
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [voiceId, setVoiceId] = useState('');
  const [jobId, setJobId] = useState('');
  const [jobStatus, setJobStatus] = useState<MediaStudioStatusResult | null>(null);
  const [error, setError] = useState('');
  const [artifactContent, setArtifactContent] = useState('');
  const [isArtifactBuilding, startArtifactTransition] = useTransition();
  const [isStarting, startTransition] = useTransition();
  const [isLoadingVoices, startVoiceTransition] = useTransition();
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedCompletionRef = useRef('');

  const artifactDraftKey = useMemo(
    () => `business-zavod:create-artifact:${activeProjectId ?? 'general'}:${modeId}`,
    [modeId, activeProjectId],
  );

  const promptText = useMemo(() => {
    return [goal.trim(), format.trim() ? 'Формат: ' + format.trim() : '', context.trim() ? 'Важно: ' + context.trim() : '']
      .filter(Boolean)
      .join('\n');
  }, [goal, format, context]);

  const isLiveMode = LIVE_MODES.has(modeId);
  const busy =
    isStarting ||
    jobStatus?.status === 'pending' ||
    jobStatus?.status === 'running';

  useEffect(() => {
    if (isLiveMode) return;
    const saved = window.localStorage.getItem(artifactDraftKey);
    setArtifactContent(saved ?? '');
  }, [artifactDraftKey, isLiveMode]);

  useEffect(() => {
    if (modeId !== 'voice' || voices.length > 0 || isLoadingVoices) {
      return;
    }

    startVoiceTransition(async () => {
      try {
        const result = await listMediaVoicesAction();
        setVoices(result);
        setVoiceId((current) => current || result[0]?.id || '');
      } catch {
        setError('Не удалось загрузить список голосов.');
      }
    });
  }, [modeId, voices.length, isLoadingVoices]);

  useEffect(() => {
    if (!kind || !jobId || !jobStatus) {
      return;
    }

    if (jobStatus.status === 'completed' || jobStatus.status === 'failed') {
      return;
    }

    pollRef.current = setTimeout(async () => {
      const next = await getMediaGenerationStatusAction(kind, jobId, activeProjectId);
      setJobStatus(next);
      if (next.status === 'failed') {
        setError('Генерация завершилась с ошибкой: ' + next.providerStatus);
      }
    }, 3000);

    return () => {
      if (pollRef.current) clearTimeout(pollRef.current);
    };
  }, [kind, jobId, jobStatus, activeProjectId]);


  useEffect(() => {
    if (
      !activeProjectId ||
      !kind ||
      jobStatus?.status !== 'completed' ||
      !jobStatus.outputUrl ||
      savedCompletionRef.current === jobStatus.outputUrl
    ) {
      return;
    }

    savedCompletionRef.current = jobStatus.outputUrl;
    void saveFactoryArtifactAction({
      projectId: activeProjectId,
      stage: 'create',
      title: modeLabel(modeId),
      content: [goal.trim(), jobStatus.outputUrl].filter(Boolean).join('\n\n'),
      metadata: {
        modeId,
        outputUrl: jobStatus.outputUrl,
        storagePath: jobStatus.storagePath ?? null,
        providerStatus: jobStatus.providerStatus,
      },
    });
  }, [activeProjectId, goal, jobStatus, kind, modeId]);

  if (!isLiveMode || !kind) {
    const buildArtifact = () => {
      if (!goal.trim() || isArtifactBuilding) return;

      setError('');
      startArtifactTransition(async () => {
        let targetProjectId = activeProjectId;
        if (!targetProjectId) {
          const project = await ensureFactoryProjectAction({
            seed: goal,
            stage: 'create',
          });
          targetProjectId = project.projectId;
          setActiveProjectId(targetProjectId);
        }

        const result = await generateCreateStudioArtifactAction({
          modeId,
          goal,
          format,
          context,
          projectId: targetProjectId,
        });

        if (result.status === 'failed') {
          setError(result.message);
          return;
        }

        setActiveProjectId(result.projectId);
        setArtifactContent(result.content);
        window.localStorage.setItem(
          `business-zavod:create-artifact:${result.projectId}:${modeId}`,
          result.content,
        );
      });
    };

    const sendArtifactToPublish = () => {
      if (!artifactContent) return;
      window.sessionStorage.setItem('business-zavod:publish-source', artifactContent);
      router.push(
        '/modules/publish/studio' +
          (activeProjectId ? '?project=' + encodeURIComponent(activeProjectId) : ''),
      );
    };

    const copyArtifact = async () => {
      if (!artifactContent) return;
      try {
        await navigator.clipboard.writeText(artifactContent);
      } catch {
        setError('Не удалось скопировать результат автоматически.');
      }
    };

    const downloadArtifact = () => {
      if (!artifactContent) return;
      const blob = new Blob([artifactContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download =
        modeId === 'presentation'
          ? 'presentation.txt'
          : modeId === 'stories'
            ? 'stories.txt'
            : 'document.txt';
      anchor.click();
      URL.revokeObjectURL(url);
    };

    return (
      <section className="relative mt-5 overflow-hidden rounded-[30px] border border-[#58dbe8]/10 bg-[linear-gradient(145deg,#070a0f,#0a1018)] p-5 text-white sm:p-6">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(88,219,232,.10),transparent_68%)]"
        />

        <div className="relative grid gap-5 xl:grid-cols-[.78fr_1.22fr]">
          <div>
            <p className="text-[12px] font-black uppercase tracking-[0.14em] text-[#79eaf2]">
              РЕАЛЬНОЕ ПРОИЗВОДСТВО
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-[#fff8e7]">
              Собрать готовый материал
            </h2>
            <p className="mt-3 text-base leading-7 text-white/72">
              OSA не выдаёт план действий — она сразу производит первый рабочий вариант,
              который можно редактировать и использовать.
            </p>

            <div className="mt-5 rounded-[20px] border border-white/[0.08] bg-black/20 p-4">
              <p className="text-sm font-bold text-white/82">Задача</p>
              <p className="mt-2 text-sm leading-6 text-white/66">
                {goal.trim() || 'Сначала опишите результат выше.'}
              </p>
            </div>

            <button
              type="button"
              onClick={buildArtifact}
              disabled={!goal.trim() || isArtifactBuilding}
              className="mt-4 w-full rounded-[18px] bg-[linear-gradient(135deg,#f2d474,#c68a26)] px-5 py-3.5 text-sm font-black text-[#181006] shadow-[0_16px_34px_-20px_rgba(241,201,108,.55)] transition hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:translate-y-0"
            >
              {isArtifactBuilding ? 'OSA собирает результат…' : 'Собрать готовый результат →'}
            </button>

            {error ? (
              <p className="mt-3 rounded-2xl border border-red-300/10 bg-red-300/[0.04] px-3 py-2.5 text-sm leading-6 text-red-100/80">
                {error}
              </p>
            ) : null}
          </div>

          <div className="min-h-[300px] rounded-[24px] border border-white/[0.08] bg-black/20 p-5">
            <div className="flex items-center justify-between gap-3 border-b border-white/[0.07] pb-3">
              <p className="text-[12px] font-black uppercase tracking-[0.14em] text-[#f1c96c]">
                ВЫХОД ЛИНИИ
              </p>
              <span className="text-[12px] font-bold text-emerald-200/80">
                {artifactContent ? 'READY' : 'WAITING'}
              </span>
            </div>

            {artifactContent ? (
              <div>
                <div className="mt-4 whitespace-pre-wrap text-base leading-7 text-white/82">
                  {artifactContent}
                </div>
                <div className="mt-5 flex flex-wrap gap-2 border-t border-white/[0.07] pt-4">
                  <button
                    type="button"
                    onClick={copyArtifact}
                    className="rounded-xl border border-white/[0.10] bg-white/[0.03] px-3 py-2 text-xs font-bold text-white/74 hover:border-[#69e4ee]/24 hover:text-white"
                  >
                    Скопировать
                  </button>
                  <button
                    type="button"
                    onClick={downloadArtifact}
                    className="rounded-xl border border-white/[0.10] bg-white/[0.03] px-3 py-2 text-xs font-bold text-white/74 hover:border-[#f1c96c]/24 hover:text-white"
                  >
                    Скачать TXT
                  </button>
                  <button
                    type="button"
                    onClick={sendArtifactToPublish}
                    className="rounded-xl bg-[linear-gradient(135deg,#69e4ee,#399fb5)] px-3 py-2 text-xs font-black text-[#041015]"
                  >
                    В цех публикации →
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      window.localStorage.removeItem(artifactDraftKey);
                      setArtifactContent('');
                    }}
                    className="rounded-xl border border-white/[0.08] px-3 py-2 text-xs font-bold text-white/48 hover:text-white/72"
                  >
                    Очистить
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex min-h-[240px] items-center justify-center text-center">
                <div>
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.03] text-2xl text-[#79eaf2]">
                    ✦
                  </div>
                  <p className="mt-4 text-base font-semibold text-white/72">
                    Готовый материал появится здесь
                  </p>
                  <p className="mt-2 max-w-sm text-sm leading-6 text-white/55">
                    Сторис, презентация или документ будут собраны как рабочий результат, а не как инструкция.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    );
  }

  const startGeneration = () => {
    if (!promptText || !approved || busy) return;

    setError('');
    setJobId('');
    setJobStatus(null);

    startTransition(async () => {
      let targetProjectId = activeProjectId;
      if (!targetProjectId) {
        const project = await ensureFactoryProjectAction({
          seed: goal,
          stage: 'create',
        });
        targetProjectId = project.projectId;
        setActiveProjectId(targetProjectId);
      }

      const result = await startMediaGenerationAction({
        kind,
        promptText,
        approved,
        ratio: kind === 'video' ? '768:1280' : '1080:1920',
        duration,
        imageUrl: kind === 'video' ? referenceImageUrl : undefined,
        voiceId: kind === 'voice' ? voiceId : undefined,
        projectId: targetProjectId,
      });

      if (result.status !== 'started') {
        setError(result.message);
        return;
      }

      setJobId(result.id);
      const initial: MediaStudioStatusResult = {
        status: 'pending',
        providerStatus: 'pending',
        outputUrl: null,
        outputUrls: [],
        ephemeral: false,
      };
      setJobStatus(initial);
    });
  };

  const selectedVoice = voices.find((voice) => voice.id === voiceId) ?? null;
  const displayStatus = jobStatus?.status ?? 'idle';

  return (
    <section className="relative mt-5 overflow-hidden rounded-[30px] border border-[#58dbe8]/10 bg-[linear-gradient(145deg,#070a0f,#0a1018)] p-5 text-white sm:p-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(88,219,232,.10),transparent_68%)]"
      />

      <div className="relative grid gap-6 xl:grid-cols-[.9fr_1.1fr]">
        <div>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[12px] font-black uppercase tracking-[0.14em] text-[#79eaf2]">
                Реальное производство
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#fff8e7]">
                {modeLabel(modeId)}
              </h2>
            </div>
            <span
              className={[
                'rounded-full border px-3 py-1.5 text-[12px] font-bold',
                displayStatus === 'completed'
                  ? 'border-emerald-300/15 bg-emerald-300/[0.06] text-emerald-200'
                  : displayStatus === 'failed'
                    ? 'border-red-300/15 bg-red-300/[0.06] text-red-200'
                    : 'border-[#58dbe8]/15 bg-[#58dbe8]/[0.05] text-[#8ceaf2]',
              ].join(' ')}
            >
              {statusLabel(displayStatus)}
            </span>
          </div>

          <p className="mt-4 text-base leading-7 text-white/72">
            Это уже не демонстрация: кнопка ниже запускает внешний генератор и может расходовать
            платные кредиты. Поэтому запуск возможен только после явного подтверждения.
          </p>

          {kind === 'video' ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-white/78">Длительность сцены</span>
                <select
                  value={duration}
                  onChange={(event) => setDuration(Number(event.target.value))}
                  className="rounded-2xl border border-white/[0.08] bg-[#0a0e15] px-3.5 py-3 text-sm text-white outline-none"
                >
                  <option value={5}>5 секунд</option>
                  <option value={10}>10 секунд</option>
                </select>
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-white/78">Референс-кадр · необязательно</span>
                <input
                  value={referenceImageUrl}
                  onChange={(event) => setReferenceImageUrl(event.target.value)}
                  placeholder="https://…"
                  className="rounded-2xl border border-white/[0.08] bg-[#0a0e15] px-3.5 py-3 text-sm text-white outline-none focus:border-[#58dbe8]/25"
                />
              </label>
            </div>
          ) : null}

          {kind === 'voice' ? (
            <div className="mt-5">
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-white/78">Голос</span>
                <select
                  value={voiceId}
                  onChange={(event) => setVoiceId(event.target.value)}
                  disabled={isLoadingVoices}
                  className="rounded-2xl border border-white/[0.08] bg-[#0a0e15] px-3.5 py-3 text-sm text-white outline-none disabled:opacity-45"
                >
                  {voices.length === 0 ? (
                    <option value="">
                      {isLoadingVoices ? 'Загружаю голоса…' : 'Нет доступных голосов'}
                    </option>
                  ) : (
                    voices.map((voice) => (
                      <option key={voice.id} value={voice.id}>
                        {voice.name}{voice.category ? ' · ' + voice.category : ''}
                      </option>
                    ))
                  )}
                </select>
              </label>
              {selectedVoice?.previewUrl ? (
                <audio className="mt-3 h-9 w-full" controls preload="none" src={selectedVoice.previewUrl}>
                  Предпросмотр голоса недоступен.
                </audio>
              ) : null}
            </div>
          ) : null}

          <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-[18px] border border-[#e7b952]/13 bg-[#e7b952]/[0.035] p-3.5">
            <input
              type="checkbox"
              checked={approved}
              onChange={(event) => setApproved(event.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[#e7b952]"
            />
            <span className="text-sm leading-6 text-white/72">
              <strong className="block text-[#f2d474]">
                Подтверждаю запуск платной генерации
              </strong>
              Я понимаю, что внешний сервис может списать кредиты за этот запуск.
            </span>
          </label>

          <button
            type="button"
            onClick={startGeneration}
            disabled={!promptText || !approved || busy || (kind === 'voice' && !voiceId)}
            className="mt-4 w-full rounded-[18px] bg-[linear-gradient(135deg,#58dbe8,#338eaa)] px-5 py-3.5 text-sm font-extrabold text-[#041015] shadow-[0_16px_34px_-20px_rgba(88,219,232,.75)] transition hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:translate-y-0"
          >
            {busy ? 'Генерация запущена…' : 'Запустить реальную генерацию'}
          </button>

          {error ? (
            <p className="mt-3 rounded-2xl border border-red-300/10 bg-red-300/[0.04] px-3 py-2.5 text-sm leading-6 text-red-100/80">
              {error}
            </p>
          ) : null}
        </div>

        <div className="min-h-[250px] rounded-[24px] border border-white/[0.065] bg-black/20 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[12px] font-black uppercase tracking-[0.14em] text-white/65">
              Выход линии
            </p>
            {jobId ? (
              <span className="max-w-[180px] truncate text-[11px] text-white/48" title={jobId}>
                ID {jobId}
              </span>
            ) : null}
          </div>

          {!jobStatus ? (
            <div className="flex min-h-[205px] items-center justify-center text-center">
              <div>
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.025] text-xl text-white/20">
                  {kind === 'video' ? '▶' : kind === 'image' ? '◇' : '◉'}
                </div>
                <p className="mt-4 text-base font-semibold text-white/72">Результат появится здесь</p>
                <p className="mt-1 text-sm leading-6 text-white/58">
                  Сначала опиши результат слева и подтверди платный запуск.
                </p>
              </div>
            </div>
          ) : jobStatus.status === 'pending' || jobStatus.status === 'running' ? (
            <div className="flex min-h-[205px] items-center justify-center text-center">
              <div className="w-full max-w-sm">
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-white/[0.08] border-t-[#58dbe8]" />
                <p className="mt-4 text-sm font-semibold text-[#dffbff]">
                  {jobStatus.status === 'running' ? 'Производство идёт' : 'Задача в очереди'}
                </p>
                <p className="mt-1 text-[12px] text-white/58">
                  Статус проверяется автоматически каждые 3 секунды.
                </p>
              </div>
            </div>
          ) : jobStatus.status === 'completed' && jobStatus.outputUrl ? (
            <div>
              {kind === 'video' ? (
                <video
                  className="max-h-[420px] w-full rounded-[18px] bg-black object-contain"
                  controls
                  playsInline
                  src={jobStatus.outputUrl}
                />
              ) : kind === 'image' ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={jobStatus.outputUrl}
                  alt="Сгенерированный результат"
                  className="max-h-[420px] w-full rounded-[18px] bg-black object-contain"
                />
              ) : (
                <audio className="mt-10 w-full" controls src={jobStatus.outputUrl}>
                  Готовая озвучка недоступна в этом браузере.
                </audio>
              )}

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <p className="text-[12px] font-semibold text-emerald-200/85">Готово · {jobStatus.providerStatus}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={jobStatus.outputUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[12px] font-semibold text-[#a8f3f8] hover:text-white"
                  >
                    Открыть файл ↗
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      const source = [
                        goal.trim(),
                        format.trim() ? 'Формат: ' + format.trim() : '',
                        context.trim() ? 'Важно: ' + context.trim() : '',
                        'Готовый файл: ' + jobStatus.outputUrl,
                      ].filter(Boolean).join('\n');
                      window.sessionStorage.setItem('business-zavod:publish-source', source);
                      router.push(
                        '/modules/publish/studio?project=' + encodeURIComponent(activeProjectId ?? ''),
                      );
                    }}
                    className="rounded-lg border border-[#69e4ee]/18 px-2.5 py-1.5 text-[11px] font-bold text-[#a8f3f8]"
                  >
                    Подготовить публикацию
                  </button>
                </div>
              </div>

              {jobStatus.ephemeral ? (
                <p className="mt-3 rounded-2xl border border-amber-300/10 bg-amber-300/[0.035] px-3 py-2 text-sm leading-6 text-amber-100/75">
                  Временная ссылка провайдера. На следующем этапе подключим постоянное сохранение
                  файла в хранилище Бизнес-Завода.
                </p>
              ) : null}
            </div>
          ) : (
            <div className="flex min-h-[205px] items-center justify-center text-center">
              <div>
                <p className="text-base font-semibold text-red-100/82">Генерация не завершена</p>
                <p className="mt-2 text-[12px] text-white/58">{jobStatus.providerStatus}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
