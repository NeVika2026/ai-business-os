'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, useTransition } from 'react';

import {
  generateCreateStudioArtifactAction,
  getMediaGenerationStatusAction,
  listMediaVoicesAction,
  startMediaGenerationAction,
  type MediaStudioKind,
  type MediaStudioStatusResult,
} from '@/app/(dashboard)/modules/create/studio/actions';
import {
  buildFactoryBundlePrompt,
  resolveBusinessRouterPlan,
  type BusinessRouterOutput,
} from '@/utils/home/business-router';

type FactoryBundleStudioProps = {
  initialPrompt: string;
};

type MediaJob = {
  key: string;
  label: string;
  kind: MediaStudioKind;
  id: string;
  status: MediaStudioStatusResult;
};

const PAID_OUTPUTS = new Set<BusinessRouterOutput>(['video', 'image', 'banner', 'voice']);

const OUTPUT_LABELS: Record<BusinessRouterOutput, string> = {
  video: 'Reels / видео',
  stories: 'Stories',
  image: 'Визуал',
  banner: 'Баннер',
  post: 'Пост',
  telegram: 'Telegram',
  voice: 'Озвучка',
  site: 'Сайт',
  presentation: 'Презентация',
  document: 'Документ',
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

export function FactoryBundleStudio({ initialPrompt }: FactoryBundleStudioProps) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [approved, setApproved] = useState(false);
  const [message, setMessage] = useState('');
  const [projectId, setProjectId] = useState<string | null>(null);
  const [textResult, setTextResult] = useState('');
  const [storiesResult, setStoriesResult] = useState('');
  const [jobs, setJobs] = useState<MediaJob[]>([]);
  const [voiceId, setVoiceId] = useState<string | null>(null);
  const [isStarting, startTransition] = useTransition();
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const plan = useMemo(() => resolveBusinessRouterPlan(prompt), [prompt]);
  const paidOutputs = plan.outputs.filter((output) => PAID_OUTPUTS.has(output));
  const needsApproval = paidOutputs.length > 0;
  const busy =
    isStarting ||
    jobs.some((job) => job.status.status === 'pending' || job.status.status === 'running');

  useEffect(() => {
    let cancelled = false;

    void listMediaVoicesAction().then((voices) => {
      if (!cancelled) setVoiceId(voices[0]?.id ?? null);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!jobs.some((job) => job.status.status === 'pending' || job.status.status === 'running')) {
      return;
    }

    pollRef.current = setTimeout(async () => {
      const nextJobs = await Promise.all(
        jobs.map(async (job) => {
          if (job.status.status === 'completed' || job.status.status === 'failed') return job;
          const status = await getMediaGenerationStatusAction(job.kind, job.id, projectId);
          return { ...job, status };
        }),
      );
      setJobs(nextJobs);
    }, 3500);

    return () => {
      if (pollRef.current) clearTimeout(pollRef.current);
    };
  }, [jobs, projectId]);

  const start = () => {
    const trimmed = prompt.trim();

    if (!trimmed || plan.kind !== 'factory_bundle' || busy) return;

    if (needsApproval && !approved) {
      setMessage('Подтвердите платные генерации для медиа-цехов.');
      return;
    }

    setMessage('');
    setJobs([]);
    setTextResult('');
    setStoriesResult('');

    startTransition(async () => {
      const bundlePrompt = buildFactoryBundlePrompt(plan, trimmed);
      const brief = await generateCreateStudioArtifactAction({
        modeId: 'document',
        goal: bundlePrompt,
        format: 'Единый производственный пакет: готовые тексты, CTA, подписи и инструкции для всех форматов.',
      });

      if (brief.status === 'failed') {
        setMessage(brief.message);
        return;
      }

      const activeProjectId = brief.projectId;
      setProjectId(activeProjectId);
      setTextResult(brief.content);

      if (plan.outputs.includes('stories')) {
        const stories = await generateCreateStudioArtifactAction({
          modeId: 'stories',
          goal: trimmed,
          context: 'Собери Stories как часть единой кампании. Сохраняй один оффер и визуальную логику.',
          projectId: activeProjectId,
        });

        if (stories.status === 'completed') {
          setStoriesResult(stories.content);
        }
      }

      const starters: Array<Promise<{
        label: string;
        kind: MediaStudioKind;
        result: Awaited<ReturnType<typeof startMediaGenerationAction>>;
      }>> = [];

      if (plan.outputs.includes('video')) {
        starters.push(
          startMediaGenerationAction({
            kind: 'video',
            promptText: trimmed + '\nСобери вертикальный рекламный ролик как часть единой кампании.',
            approved,
            ratio: '768:1280',
            duration: 5,
            projectId: activeProjectId,
          }).then((result) => ({ label: 'Reels / видео', kind: 'video' as const, result })),
        );
      }

      if (plan.outputs.includes('image') || plan.outputs.includes('banner')) {
        starters.push(
          startMediaGenerationAction({
            kind: 'image',
            promptText:
              trimmed +
              '\nСоздай главный рекламный визуал/баннер. Он должен соответствовать общей кампании и офферу.',
            approved,
            ratio: '1080:1350',
            projectId: activeProjectId,
          }).then((result) => ({ label: 'Главный визуал', kind: 'image' as const, result })),
        );
      }

      if (plan.outputs.includes('voice') && voiceId) {
        starters.push(
          startMediaGenerationAction({
            kind: 'voice',
            promptText:
              'Озвучь коротко и убедительно главный рекламный посыл этой кампании: ' + trimmed,
            approved,
            voiceId,
            projectId: activeProjectId,
          }).then((result) => ({ label: 'Озвучка', kind: 'voice' as const, result })),
        );
      }

      const started = await Promise.all(starters);
      const nextJobs: MediaJob[] = [];
      const failures: string[] = [];

      for (const item of started) {
        if (item.result.status === 'started') {
          nextJobs.push({
            key: item.kind + ':' + item.result.id,
            label: item.label,
            kind: item.kind,
            id: item.result.id,
            status: pendingStatus(),
          });
        } else {
          failures.push(item.label + ': ' + item.result.message);
        }
      }

      setJobs(nextJobs);

      if (failures.length) {
        setMessage('Часть цехов не запустилась: ' + failures.join(' · '));
      } else if (nextJobs.length) {
        setMessage('Маршрут запущен. Медиа-цеха работают параллельно.');
      } else {
        setMessage('Текстовый пакет собран.');
      }
    });
  };

  const completed = jobs.filter((job) => job.status.status === 'completed').length;

  return (
    <main className="mx-auto w-full max-w-[1380px] pb-16 text-[#f7f2e8]">
      <section className="overflow-hidden rounded-[34px] border border-white/[0.09] bg-[linear-gradient(145deg,#05070b,#0b1018_58%,#06080c)] p-6 sm:p-8">
        <p className="text-[12px] font-black uppercase tracking-[.18em] text-[#79eaf2]">
          БИЗНЕС-ЗАВОД · AI ROUTER
        </p>
        <h1 className="mt-3 text-[clamp(2.6rem,5vw,5rem)] font-black leading-[.94] tracking-[-.055em] text-[#fff8e7]">
          Один запрос.
          <span className="block text-[#f1c96c]">Несколько цехов.</span>
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-white/58">
          Маршрутизатор разобрал пакетную задачу, определил результаты и запускает только нужные производственные линии.
        </p>
      </section>

      <div className="mt-5 grid gap-5 xl:grid-cols-[.82fr_1.18fr]">
        <section className="rounded-[28px] border border-white/[0.08] bg-[#080c12] p-5 sm:p-6">
          <label className="grid gap-2">
            <span className="text-xs font-black uppercase tracking-[.14em] text-white/46">
              ЗАДАЧА
            </span>
            <textarea
              rows={7}
              value={prompt}
              disabled={busy}
              onChange={(event) => setPrompt(event.target.value)}
              className="resize-none rounded-[20px] border border-white/[0.09] bg-black/25 px-4 py-4 text-sm leading-6 text-white outline-none"
            />
          </label>

          <div className="mt-5">
            <p className="text-xs font-black uppercase tracking-[.14em] text-white/46">
              РЕЗУЛЬТАТЫ
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {plan.outputs.map((output) => (
                <span
                  key={output}
                  className="rounded-full border border-[#69e4ee]/20 bg-[#69e4ee]/[0.06] px-3 py-2 text-xs font-bold text-[#bff9fc]"
                >
                  {OUTPUT_LABELS[output]}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-5 rounded-[20px] border border-white/[0.07] bg-white/[0.025] p-4">
            <p className="text-xs font-black uppercase tracking-[.14em] text-white/46">
              МАРШРУТ
            </p>
            <ol className="mt-3 grid gap-2 text-sm text-white/68">
              {plan.tools.map((tool, index) => (
                <li key={tool} className="flex gap-3">
                  <span className="text-[#f1c96c]">{String(index + 1).padStart(2, '0')}</span>
                  <span>{tool}</span>
                </li>
              ))}
            </ol>
            {plan.parallel.length ? (
              <p className="mt-3 text-xs text-white/42">
                Параллельно: {plan.parallel.join(', ')}
              </p>
            ) : null}
          </div>

          {needsApproval ? (
            <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-[18px] border border-[#f1c96c]/18 bg-[#f1c96c]/[0.045] p-4">
              <input
                type="checkbox"
                checked={approved}
                disabled={busy}
                onChange={(event) => setApproved(event.target.checked)}
                className="mt-1 h-4 w-4"
              />
              <span className="text-sm leading-6 text-white/62">
                Подтверждаю запуск платных медиа-генераций и возможное списание кредитов. Текстовые этапы выполняются без этого подтверждения.
              </span>
            </label>
          ) : null}

          <button
            type="button"
            onClick={start}
            disabled={busy || plan.kind !== 'factory_bundle' || (needsApproval && !approved)}
            className="mt-5 w-full rounded-[18px] bg-[linear-gradient(135deg,#ffe08a,#d79a30)] px-5 py-4 text-sm font-black text-[#1b1105] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-35"
          >
            {busy ? 'Завод работает…' : 'Запустить весь маршрут →'}
          </button>

          {message ? (
            <p className="mt-4 rounded-2xl border border-white/[0.07] bg-white/[0.02] px-4 py-3 text-sm leading-6 text-white/66">
              {message}
            </p>
          ) : null}
        </section>

        <section className="rounded-[28px] border border-white/[0.08] bg-[#080c12] p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[.14em] text-[#79eaf2]">
                ПРОИЗВОДСТВО
              </p>
              <h2 className="mt-2 text-2xl font-black text-[#fff8e7]">Пакет проекта</h2>
            </div>
            {projectId ? (
              <Link
                href={'/projects/' + projectId}
                className="rounded-xl border border-white/[0.09] px-3 py-2 text-xs font-bold text-white/62"
              >
                Открыть проект →
              </Link>
            ) : null}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {jobs.map((job) => (
              <article
                key={job.key}
                className="rounded-[20px] border border-white/[0.07] bg-white/[0.025] p-4"
              >
                <p className="text-sm font-black text-[#fff8e7]">{job.label}</p>
                <p className="mt-1 text-xs text-white/42">{job.status.providerStatus}</p>
                {job.status.status === 'completed' && job.status.outputUrl ? (
                  <a
                    href={job.status.outputUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex rounded-xl border border-[#69e4ee]/20 px-3 py-2 text-xs font-bold text-[#9af5fb]"
                  >
                    Открыть результат →
                  </a>
                ) : (
                  <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                    <div
                      className={[
                        'h-full rounded-full bg-[#69e4ee]',
                        job.status.status === 'failed' ? 'w-full opacity-30' : 'w-2/3 animate-pulse',
                      ].join(' ')}
                    />
                  </div>
                )}
              </article>
            ))}
          </div>

          {!projectId ? (
            <div className="flex min-h-[430px] items-center justify-center text-center">
              <div>
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[24px] border border-[#69e4ee]/12 bg-[#69e4ee]/[0.035] text-xl font-black text-[#79eaf2]">
                  AI
                </div>
                <p className="mt-5 text-xl font-black text-[#fff8e7]">
                  Готов к запуску
                </p>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/46">
                  После подтверждения OSA создаст проект и запустит независимые цеха параллельно.
                </p>
              </div>
            </div>
          ) : null}

          {projectId ? (
            <div className="mt-5 grid gap-4">
              <div className="rounded-[20px] border border-white/[0.07] bg-black/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-black text-[#fff8e7]">Текстовый пакет</p>
                  <span className="text-xs text-[#8df0c8]">готово</span>
                </div>
                <pre className="mt-3 max-h-[320px] overflow-auto whitespace-pre-wrap font-sans text-xs leading-6 text-white/60">
                  {textResult}
                </pre>
              </div>

              {storiesResult ? (
                <div className="rounded-[20px] border border-white/[0.07] bg-black/20 p-4">
                  <p className="text-sm font-black text-[#fff8e7]">Stories</p>
                  <pre className="mt-3 max-h-[300px] overflow-auto whitespace-pre-wrap font-sans text-xs leading-6 text-white/60">
                    {storiesResult}
                  </pre>
                </div>
              ) : null}

              {jobs.length ? (
                <p className="text-xs text-white/42">
                  Медиа готово: {completed}/{jobs.length}. Ошибка одного цеха не останавливает остальные.
                </p>
              ) : null}
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
