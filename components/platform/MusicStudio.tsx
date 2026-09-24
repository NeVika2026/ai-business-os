'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';

import { generateMusicAction } from '@/app/(dashboard)/modules/create/studio/actions';

type Props = {
  projectId?: string | null;
};

export function MusicStudio({ projectId = null }: Props) {
  const [prompt, setPrompt] = useState('');
  const [durationSeconds, setDurationSeconds] = useState(15);
  const [instrumental, setInstrumental] = useState(true);
  const [approved, setApproved] = useState(false);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(projectId);
  const [outputUrl, setOutputUrl] = useState('');
  const [message, setMessage] = useState('');
  const [isGenerating, startTransition] = useTransition();

  const generate = () => {
    if (!prompt.trim() || !approved || isGenerating) return;

    setMessage('');
    setOutputUrl('');

    startTransition(async () => {
      const result = await generateMusicAction({
        prompt,
        approved,
        durationSeconds,
        instrumental,
        projectId: activeProjectId,
      });

      if (result.status !== 'completed') {
        setMessage(result.message);
        return;
      }

      setActiveProjectId(result.projectId);
      setOutputUrl(result.outputUrl);
      setMessage('Музыка готова и сохранена в проект.');
    });
  };

  return (
    <main className="mx-auto w-full max-w-[1320px] pb-16 text-[#f7f2e8]">
      <section className="rounded-[34px] border border-white/[0.09] bg-[linear-gradient(145deg,#05070b,#0b1018_58%,#06080c)] p-6 sm:p-8">
        <p className="text-[12px] font-black uppercase tracking-[.18em] text-[#79eaf2]">
          БИЗНЕС-ЗАВОД · МУЗЫКА
        </p>
        <h1 className="mt-3 text-[clamp(2.8rem,5vw,5.2rem)] font-black leading-[.94] tracking-[-.055em] text-[#fff8e7]">
          Музыка под задачу.
          <span className="block text-[#f1c96c]">Не сток. Генерация.</span>
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-white/58">
          Фон для Reels, джингл, атмосферный bed, рекламный трек или полноценная композиция.
        </p>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[.78fr_1.22fr]">
        <div className="rounded-[28px] border border-white/[0.08] bg-[#080c12] p-5 sm:p-6">
          <label className="grid gap-2">
            <span className="text-sm font-bold text-white/72">Что должно звучать</span>
            <textarea
              rows={8}
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              maxLength={4100}
              placeholder="Например: энергичный премиальный электронный трек для 15-секундного Reels о новой квартире, быстрый ритм, чистый бас, современный luxury mood, без вокала"
              className="resize-none rounded-[16px] border border-white/[0.09] bg-black/25 px-4 py-3.5 text-sm leading-6 text-white outline-none"
            />
          </label>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-bold text-white/72">Длительность</span>
              <select
                value={durationSeconds}
                onChange={(event) => setDurationSeconds(Number(event.target.value))}
                className="rounded-[16px] border border-white/[0.09] bg-black/25 px-4 py-3.5 text-sm text-white outline-none"
              >
                {[10, 15, 20, 30, 45, 60, 90, 120].map((value) => (
                  <option key={value} value={value}>{value} сек.</option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-3 rounded-[16px] border border-white/[0.09] bg-black/25 px-4 py-3.5">
              <input
                type="checkbox"
                checked={instrumental}
                onChange={(event) => setInstrumental(event.target.checked)}
              />
              <span className="text-sm font-bold text-white/72">Только инструментал</span>
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
              Подтверждаю платную генерацию музыки и возможное списание кредитов.
            </span>
          </label>

          <button
            type="button"
            disabled={!approved || !prompt.trim() || isGenerating}
            onClick={generate}
            className="mt-5 w-full rounded-[18px] bg-[linear-gradient(135deg,#ffe08a,#d79a30)] px-5 py-4 text-sm font-black text-[#1b1105] disabled:cursor-not-allowed disabled:opacity-35"
          >
            {isGenerating ? 'Создаю трек…' : 'Создать музыку →'}
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
              <h2 className="mt-2 text-2xl font-black text-[#fff8e7]">Готовый трек</h2>
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

          {!outputUrl ? (
            <div className="flex min-h-[420px] items-center justify-center text-center">
              {isGenerating ? (
                <div>
                  <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-white/[0.08] border-t-[#69e4ee]" />
                  <p className="mt-4 text-sm font-black text-[#dffbff]">AI пишет музыку</p>
                </div>
              ) : (
                <p className="text-white/40">Опишите трек и запустите генерацию.</p>
              )}
            </div>
          ) : (
            <div className="mt-8 rounded-[24px] border border-white/[0.08] bg-black/25 p-6">
              <div className="flex h-40 items-center justify-center rounded-[18px] bg-[radial-gradient(circle_at_50%_50%,rgba(241,201,108,.14),transparent_65%)]">
                <span className="text-6xl text-[#f1c96c]">♪</span>
              </div>
              <audio controls src={outputUrl} className="mt-5 w-full" />
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs font-black text-emerald-200/82">ГОТОВО</span>
                <a
                  href={outputUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl border border-[#f1c96c]/16 px-3 py-2 text-xs font-black text-[#f1c96c]"
                >
                  Открыть MP3 ↗
                </a>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
