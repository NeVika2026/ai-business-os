'use client';

import { useEffect, useMemo, useState } from 'react';

import type { CreateStudioModeId } from '@/utils/platform/create-studio';

type MediaCapabilities = {
  video: boolean;
  image: boolean;
  voice: boolean;
  captions: boolean;
  montage: boolean;
};

type RunwayTaskState = {
  id: string;
  status: string;
  ready: boolean;
  failed: boolean;
  failure?: string | null;
};

type RealMediaProductionPanelProps = {
  modeId: CreateStudioModeId;
  prompt: string;
  format: string;
};

const EMPTY_CAPABILITIES: MediaCapabilities = {
  video: false,
  image: false,
  voice: false,
  captions: true,
  montage: false,
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function readJson<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T & { error?: string };

  if (!response.ok) {
    throw new Error(payload.error || 'Операция не выполнена');
  }

  return payload;
}

export function RealMediaProductionPanel({
  modeId,
  prompt,
  format,
}: RealMediaProductionPanelProps) {
  const [capabilities, setCapabilities] = useState<MediaCapabilities>(EMPTY_CAPABILITIES);
  const [capabilitiesLoaded, setCapabilitiesLoaded] = useState(false);
  const [approved, setApproved] = useState(false);
  const [busy, setBusy] = useState<'video' | 'image' | 'voice' | null>(null);
  const [task, setTask] = useState<RunwayTaskState | null>(null);
  const [audioBase64, setAudioBase64] = useState('');
  const [srt, setSrt] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    fetch('/api/media/capabilities', { cache: 'no-store' })
      .then((response) => readJson<MediaCapabilities>(response))
      .then((payload) => {
        if (!cancelled) {
          setCapabilities(payload);
          setCapabilitiesLoaded(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCapabilitiesLoaded(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setApproved(false);
    setTask(null);
    setAudioBase64('');
    setSrt('');
    setError('');
  }, [modeId]);

  const generationKind = useMemo<'video' | 'image' | null>(() => {
    if (modeId === 'video') return 'video';
    if (modeId === 'image' || modeId === 'stories') return 'image';
    return null;
  }, [modeId]);

  const generationAvailable =
    generationKind === 'video'
      ? capabilities.video
      : generationKind === 'image'
        ? capabilities.image
        : false;

  const voiceAvailable = capabilities.voice && (modeId === 'voice' || modeId === 'video');
  const hasPrompt = prompt.trim().length > 0;

  const pollTask = async (taskId: string) => {
    for (let attempt = 0; attempt < 100; attempt += 1) {
      await sleep(3000);
      const response = await fetch('/api/media/runway/' + encodeURIComponent(taskId), {
        cache: 'no-store',
      });
      const payload = await readJson<RunwayTaskState>(response);
      setTask(payload);

      if (payload.ready || payload.failed) {
        return payload;
      }
    }

    throw new Error('Генерация идёт дольше ожидаемого. Проверить результат можно позже.');
  };

  const startRunwayGeneration = async (kind: 'video' | 'image') => {
    if (!approved || !hasPrompt) return;

    setBusy(kind);
    setError('');
    setTask(null);

    try {
      const response = await fetch('/api/media/runway', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind,
          promptText: prompt,
          format,
          duration: kind === 'video' ? 5 : undefined,
          approved: true,
        }),
      });

      const created = await readJson<{ id: string; status: string }>(response);
      setTask({
        id: created.id,
        status: created.status,
        ready: false,
        failed: false,
      });

      await pollTask(created.id);
    } catch (generationError) {
      setError(
        generationError instanceof Error
          ? generationError.message
          : 'Не удалось запустить генерацию',
      );
    } finally {
      setBusy(null);
    }
  };

  const startSpeechGeneration = async () => {
    if (!approved || !hasPrompt) return;

    setBusy('voice');
    setError('');
    setAudioBase64('');
    setSrt('');

    try {
      const response = await fetch('/api/media/speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: prompt,
          approved: true,
        }),
      });

      const payload = await readJson<{
        audioBase64: string;
        mimeType: string;
        srt: string;
      }>(response);

      setAudioBase64(payload.audioBase64);
      setSrt(payload.srt);
    } catch (generationError) {
      setError(
        generationError instanceof Error
          ? generationError.message
          : 'Не удалось создать озвучку',
      );
    } finally {
      setBusy(null);
    }
  };

  if (!generationKind && !voiceAvailable && modeId !== 'voice') {
    return null;
  }

  return (
    <section className="relative mt-5 overflow-hidden rounded-[30px] border border-white/[0.08] bg-[#070a10] p-5 text-white sm:p-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(88,219,232,.11),transparent_68%)]"
      />

      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#58dbe8]">
            Реальный выпуск файла
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-[-0.04em] text-[#fff8e7]">
            Генерация подключена к производственным движкам
          </h2>
          <p className="mt-2 max-w-3xl text-xs leading-5 text-white/38">
            Здесь уже создаются реальные файлы. Ничего не запускается автоматически:
            платное действие выполняется только после отдельного подтверждения.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            ['Визуал', capabilitiesLoaded && (capabilities.video || capabilities.image)],
            ['Голос', capabilitiesLoaded && capabilities.voice],
            ['Субтитры', capabilities.captions],
          ].map(([label, ready]) => (
            <div
              key={String(label)}
              className="rounded-2xl border border-white/[0.06] bg-white/[0.025] px-3 py-2"
            >
              <span
                className={
                  ready
                    ? 'mx-auto block h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_9px_rgba(110,231,150,.55)]'
                    : 'mx-auto block h-1.5 w-1.5 rounded-full bg-white/20'
                }
              />
              <p className="mt-1.5 text-[9px] text-white/38">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <label className="relative mt-5 flex cursor-pointer items-start gap-3 rounded-[18px] border border-[#e7b952]/12 bg-[#e7b952]/[0.035] p-4">
        <input
          type="checkbox"
          checked={approved}
          onChange={(event) => setApproved(event.target.checked)}
          className="mt-0.5 h-4 w-4 accent-[#d7a83d]"
        />
        <span>
          <span className="block text-xs font-semibold text-[#f5d980]">
            Подтверждаю запуск платной генерации
          </span>
          <span className="mt-1 block text-[10px] leading-5 text-white/34">
            Видео, изображения и озвучка расходуют кредиты подключённых сервисов.
          </span>
        </span>
      </label>

      <div className="relative mt-4 grid gap-3 md:grid-cols-2">
        {generationKind ? (
          <button
            type="button"
            disabled={!approved || !hasPrompt || !generationAvailable || busy !== null}
            onClick={() => startRunwayGeneration(generationKind)}
            className="rounded-[18px] border border-[#58dbe8]/14 bg-[#58dbe8]/[0.045] px-4 py-3.5 text-left transition hover:border-[#58dbe8]/28 hover:bg-[#58dbe8]/[0.07] disabled:cursor-not-allowed disabled:opacity-35"
          >
            <span className="block text-xs font-semibold text-[#dffcff]">
              {generationKind === 'video' ? 'Создать тестовый ролик · 5 сек.' : 'Создать готовый визуал'}
            </span>
            <span className="mt-1 block text-[10px] leading-5 text-white/32">
              {generationKind === 'video'
                ? 'Запустится реальная видеогенерация. После готовности появится MP4.'
                : 'Запустится реальная генерация изображения. После готовности появится файл.'}
            </span>
          </button>
        ) : null}

        {voiceAvailable ? (
          <button
            type="button"
            disabled={!approved || !hasPrompt || busy !== null}
            onClick={startSpeechGeneration}
            className="rounded-[18px] border border-[#e7b952]/14 bg-[#e7b952]/[0.04] px-4 py-3.5 text-left transition hover:border-[#e7b952]/28 hover:bg-[#e7b952]/[0.07] disabled:cursor-not-allowed disabled:opacity-35"
          >
            <span className="block text-xs font-semibold text-[#fff0bd]">
              Создать озвучку + тайминг
            </span>
            <span className="mt-1 block text-[10px] leading-5 text-white/32">
              Получим MP3 и автоматически соберём SRT по реальным временным меткам речи.
            </span>
          </button>
        ) : null}
      </div>

      {busy ? (
        <div className="relative mt-4 rounded-[18px] border border-white/[0.06] bg-white/[0.025] p-4">
          <p className="text-xs font-semibold text-[#fff8e7]">
            {busy === 'voice' ? 'Генерирую озвучку…' : 'Производство запущено…'}
          </p>
          <p className="mt-1 text-[10px] text-white/30">
            {task?.status ? 'Статус: ' + task.status : 'Ожидаю ответ движка'}
          </p>
        </div>
      ) : null}

      {task?.ready ? (
        <a
          href={'/api/media/runway/' + encodeURIComponent(task.id) + '?download=1'}
          className="relative mt-4 inline-flex rounded-2xl bg-[linear-gradient(135deg,#f2d474,#c68a26)] px-4 py-3 text-xs font-extrabold text-[#181006] transition hover:brightness-110"
        >
          Скачать готовый файл
        </a>
      ) : null}

      {task?.failed ? (
        <p className="relative mt-4 rounded-2xl border border-red-300/10 bg-red-300/[0.04] p-3 text-xs text-red-100/80">
          Генерация остановлена: {task.failure || 'провайдер вернул ошибку'}
        </p>
      ) : null}

      {audioBase64 ? (
        <div className="relative mt-4 flex flex-wrap gap-3">
          <a
            download="business-zavod-voice.mp3"
            href={'data:audio/mpeg;base64,' + audioBase64}
            className="rounded-2xl bg-[linear-gradient(135deg,#f2d474,#c68a26)] px-4 py-3 text-xs font-extrabold text-[#181006]"
          >
            Скачать MP3
          </a>
          {srt ? (
            <a
              download="business-zavod-subtitles.srt"
              href={'data:text/plain;charset=utf-8,' + encodeURIComponent(srt)}
              className="rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-xs font-semibold text-[#dffcff]"
            >
              Скачать SRT
            </a>
          ) : null}
        </div>
      ) : null}

      {error ? (
        <p className="relative mt-4 rounded-2xl border border-red-300/10 bg-red-300/[0.04] p-3 text-xs text-red-100/80">
          {error}
        </p>
      ) : null}

      {!hasPrompt ? (
        <p className="relative mt-4 text-[10px] text-white/28">
          Сначала опишите идею или текст в поле выше.
        </p>
      ) : null}
    </section>
  );
}
