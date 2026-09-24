'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, useTransition } from 'react';

import {
  getMediaGenerationStatusAction,
  startSoundEffectAction,
  type MediaStudioStatusResult,
} from '@/app/(dashboard)/modules/create/studio/actions';
import { saveFactoryArtifactAction } from '@/app/(dashboard)/modules/factory-chain/actions';

type Props = {
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

export function SoundEffectStudio({ projectId = null }: Props) {
  const [promptText, setPromptText] = useState('');
  const [duration, setDuration] = useState(5);
  const [loop, setLoop] = useState(false);
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
      const next = await getMediaGenerationStatusAction('audio', jobId, activeProjectId);
      setStatus(next);
      if (next.status === 'failed') {
        setMessage('Генерация звука завершилась с ошибкой: ' + next.providerStatus);
      }
    }, 3000);

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
      title: 'Звуковой эффект',
      content: status.outputUrl,
      metadata: {
        artifactType: 'sound-effect',
        provider: 'runway',
        outputUrl: status.outputUrl,
        outputUrls: status.outputUrls,
        storagePath: status.storagePath ?? null,
        promptText,
        duration,
        loop,
      },
    });
  }, [activeProjectId, duration, loop, promptText, status]);

  const start = () => {
    if (!promptText.trim() || !approved || busy) return;

    setMessage('');
    setStatus(null);
    setJobId('');

    startTransition(async () => {
      const result = await startSoundEffectAction({
        promptText,
        approved,
        duration,
        loop,
        projectId: activeProjectId,
      });

      if (result.status !== 'started') {
        setMessage(result.message);
        return;
      }

      setActiveProjectId(result.projectId);
      setJobId(result.id);
      setStatus(pendingStatus());
      setMessage('Звук генерируется. Результат появится автоматически.');
    });
  };

  return (
    <main className="mx-auto w-full max-w-[1320px] pb-16 text-[#f7f2e8]">
      <section className="rounded-[34px] border border-white/[0.09] bg-[linear-gradient(145deg,#05070b,#0b1018_58%,#06080c)] p-6 sm:p-8">
        <p className="text-[12px] font-black uppercase tracking-[.18em] text-[#79eaf2]">
          БИЗНЕС-ЗАВОД · SOUND EFFECTS
        </p>
        <h1 className="mt-3 text-[clamp(2.8rem,5vw,5.2rem)] font-black leading-[.94] tracking-[-.055em] text-[#fff8e7]">
          Создать звук.
          <span className="block text-[#f1c96c]">Под сцену, ролик или интерфейс.</span>
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-white/58">
          Фоли, атмосферы, удары, whoosh, UI-звуки, окружение и бесшовные петли.
        </p>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[.78fr_1.22fr]">
        <div className="rounded-[28px] border border-white/[0.08] bg-[#080c12] p-5 sm:p-6">
          <label className="grid gap-2">
            <span className="text-sm font-bold text-white/72">Какой звук нужен</span>
            <textarea
              rows={7}
              value={promptText}
              onChange={(event) => setPromptText(event.target.value)}
              maxLength={450}
              placeholder="Например: тяжёлая входная дверь закрывается в длинном каменном коридоре, глубокий удар и короткое эхо"
              className="resize-none rounded-[16px] border border-white/[0.09] bg-black/25 px-4 py-3.5 text-sm leading-6 text-white outline-none"
            />
          </label>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-bold text-white/72">Длительность</span>
              <select
                value={duration}
                onChange={(event) => setDuration(Number(event.target.value))}
                className="rounded-[16px] border border-white/[0.09] bg-black/25 px-4 py-3.5 text-sm text-white outline-none"
              >
                {[2, 3, 5, 8, 10, 15, 20, 30].map((value) => (
                  <option key={value} value={value}>{value} сек.</option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-3 rounded-[16px] border border-white/[0.09] bg-black/25 px-4 py-3.5">
              <input type="checkbox" checked={loop} onChange={(event) => setLoop(event.target.checked)} />
              <span className="text-sm font-bold text-white/72">Бесшовная петля</span>
            </label>
          </div>

          <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-[18px] border border-[#f1c96c]/13 bg-[#f1c96c]/[0.035] p-4">
            <input
              type="checkbox"
              checked={approved}
              onChange={(event) => setApproved(event.target.checked)}
              className="mt-1 h-4 w-4"
            />
            <span className="text-sm leading-6 text-white/62">
              Подтверждаю платную генерацию и возможное списание кредитов.
            </span>
          </label>

          <button
            type="button"
            disabled={!approved || !promptText.trim() || busy}
            onClick={start}
            className="mt-5 w-full rounded-[18px] bg-[linear-gradient(135deg,#ffe08a,#d79a30)] px-5 py-4 text-sm font-black text-[#1b1105] disabled:cursor-not-allowed disabled:opacity-35"
          >
            {busy ? 'Создаю звук…' : 'Создать SFX →'}
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
              <h2 className="mt-2 text-2xl font-black text-[#fff8e7]">Готовый звук</h2>
            </div>
            {activeProjectId ? (
              <Link href={'/projects/' + activeProjectId} className="rounded-xl border border-white/[0.09] px-3 py-2 text-xs font-black text-white/62">
                Проект →
              </Link>
            ) : null}
          </div>

          {!status ? (
            <div className="flex min-h-[420px] items-center justify-center text-center text-white/40">
              Опишите звук и запустите генерацию.
            </div>
          ) : status.status === 'completed' && status.outputUrl ? (
            <div className="mt-8 rounded-[24px] border border-white/[0.08] bg-black/25 p-6">
              <div className="flex h-32 items-center justify-center rounded-[18px] bg-[radial-gradient(circle_at_50%_50%,rgba(105,228,238,.12),transparent_65%)]">
                <span className="text-5xl text-[#79eaf2]">≋</span>
              </div>
              <audio controls src={status.outputUrl} className="mt-5 w-full" />
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs font-black text-emerald-200/82">ГОТОВО</span>
                <a href={status.outputUrl} target="_blank" rel="noreferrer" className="rounded-xl border border-[#69e4ee]/16 px-3 py-2 text-xs font-black text-[#a8f3f8]">
                  Открыть MP3 ↗
                </a>
              </div>
            </div>
          ) : status.status === 'failed' ? (
            <div className="flex min-h-[420px] items-center justify-center text-center text-red-100/70">
              Не удалось создать звук.
            </div>
          ) : (
            <div className="flex min-h-[420px] items-center justify-center text-center">
              <div>
                <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-white/[0.08] border-t-[#69e4ee]" />
                <p className="mt-4 text-sm font-black text-[#dffbff]">AI создаёт звук</p>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
