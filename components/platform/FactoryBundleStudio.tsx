'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { FinalVideoExportPanel } from '@/components/platform/FinalVideoExportPanel';
import { useEffect, useMemo, useRef, useState, useTransition } from 'react';

import {
  generateCreateStudioArtifactAction,
  generateMusicAction,
  generateWebsiteArtifactAction,
  getMediaGenerationStatusAction,
  listMediaVoicesAction,
  startMediaGenerationAction,
  startSoundEffectAction,
  type MediaStudioKind,
  type MediaStudioStatusResult,
} from '@/app/(dashboard)/modules/create/studio/actions';
import {
  buildFactoryBundlePrompt,
  resolveBusinessRouterPlan,
  type BusinessRouterOutput,
} from '@/utils/home/business-router';
import type { CreateStudioModeId } from '@/utils/platform/create-studio';
import {
  loadLatestFactoryBundleSnapshotAction,
  saveFactoryBundleSnapshotAction,
} from '@/app/(dashboard)/modules/factory-chain/actions';

type FactoryBundleStudioProps = {
  initialPrompt: string;
  initialProjectId?: string | null;
};

type TextTaskStatus = 'queued' | 'running' | 'completed' | 'failed';

type TextTask = {
  key: string;
  label: string;
  mode: CreateStudioModeId | 'website';
  title: string;
  artifactType: string;
  format?: string;
  context?: string;
  status: TextTaskStatus;
  content: string;
  error: string;
};

type MediaLaunchSpec = {
  key: string;
  label: string;
  kind: MediaStudioKind;
  engine?: 'studio' | 'music' | 'sfx';
  promptText: string;
  ratio?: string;
  duration?: number;
  voiceId?: string;
};

type MediaJob = {
  key: string;
  label: string;
  kind: MediaStudioKind;
  id: string;
  status: MediaStudioStatusResult;
  spec: MediaLaunchSpec;
};

const PAID_OUTPUTS = new Set<BusinessRouterOutput>([
  'video',
  'image',
  'banner',
  'voice',
  'music',
  'sfx',
]);

const OUTPUT_LABELS: Record<BusinessRouterOutput, string> = {
  video: 'Reels / видео',
  stories: 'Stories',
  image: 'Визуал',
  banner: 'Баннер',
  post: 'Пост',
  telegram: 'Telegram',
  voice: 'Озвучка',
  music: 'Музыка',
  sfx: 'Звуковые эффекты',
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

function buildTextTasks(outputs: BusinessRouterOutput[]): TextTask[] {
  const tasks: TextTask[] = [
    {
      key: 'strategy',
      label: 'Стратегия кампании',
      mode: 'document',
      title: 'Стратегия кампании',
      artifactType: 'campaign-strategy',
      format:
        'Краткая рабочая стратегия: аудитория, главный оффер, хук, ключевой посыл, CTA, единая визуальная логика и связь всех форматов.',
      status: 'queued',
      content: '',
      error: '',
    },
  ];

  if (outputs.includes('stories')) {
    tasks.push({
      key: 'stories',
      label: 'Stories',
      mode: 'stories',
      title: 'Серия Stories',
      artifactType: 'stories',
      format: 'Готовая серия Stories: каждая карточка отдельно, сильный хук, развитие и CTA.',
      context: 'Это часть одной кампании. Не меняй основной оффер и визуальную логику.',
      status: 'queued',
      content: '',
      error: '',
    });
  }

  if (outputs.includes('post')) {
    tasks.push({
      key: 'post',
      label: 'Пост',
      mode: 'document',
      title: 'Пост для соцсетей',
      artifactType: 'social-post',
      format:
        'Готовый пост для публикации: сильное начало, основной текст, CTA. Без пояснений автора и без черновых заметок.',
      context: 'Сохраняй тот же оффер и смысл, что во всей кампании.',
      status: 'queued',
      content: '',
      error: '',
    });
  }

  if (outputs.includes('telegram')) {
    tasks.push({
      key: 'telegram',
      label: 'Telegram-пост',
      mode: 'document',
      title: 'Telegram-пост',
      artifactType: 'telegram-post',
      format:
        'Готовый Telegram-пост: короткие абзацы, живой ритм, сильный первый экран и понятный CTA. Без служебных пояснений.',
      context: 'Адаптируй под Telegram, но не меняй оффер кампании.',
      status: 'queued',
      content: '',
      error: '',
    });
  }

  if (outputs.includes('document')) {
    tasks.push({
      key: 'document',
      label: 'Документ',
      mode: 'document',
      title: 'Документ кампании',
      artifactType: 'campaign-document',
      format: 'Готовый структурированный документ по задаче пользователя.',
      status: 'queued',
      content: '',
      error: '',
    });
  }

  if (outputs.includes('presentation')) {
    tasks.push({
      key: 'presentation',
      label: 'Презентация',
      mode: 'presentation',
      title: 'Презентация',
      artifactType: 'presentation',
      format: 'Готовая структура презентации со слайдами, заголовками и текстами.',
      status: 'queued',
      content: '',
      error: '',
    });
  }

  if (outputs.includes('site')) {
    tasks.push({
      key: 'site',
      label: 'Сайт',
      mode: 'website',
      title: 'Сайт',
      artifactType: 'website_html',
      format: 'Готовый адаптивный одностраничный сайт.',
      status: 'queued',
      content: '',
      error: '',
    });
  }

  if (outputs.includes('voice')) {
    tasks.push({
      key: 'voice-script',
      label: 'Текст озвучки',
      mode: 'document',
      title: 'Текст озвучки',
      artifactType: 'voice-script',
      format:
        'Напиши только готовый текст диктора на 8–10 секунд. Без заголовков, пояснений, кавычек и служебных слов. Один сильный хук, одна ключевая выгода, короткий CTA.',
      context:
        'Это озвучка рекламного ролика. Текст должен звучать естественно вслух и соответствовать общему офферу кампании.',
      status: 'queued',
      content: '',
      error: '',
    });
  }

  tasks.push({
    key: 'qa',
    label: 'Контроль качества',
    mode: 'document',
    title: 'Контроль качества пакета',
    artifactType: 'campaign-qa',
    format:
      'Проверь комплект как редактор выпуска: единый оффер, отсутствие противоречий, единый CTA, соответствие исходной задаче, пригодность к публикации. Верни краткий вердикт и только конкретные замечания.',
    status: 'queued',
    content: '',
    error: '',
  });

  return tasks;
}

export function FactoryBundleStudio({
  initialPrompt,
  initialProjectId = null,
}: FactoryBundleStudioProps) {
  const router = useRouter();
  const [prompt, setPrompt] = useState(initialPrompt);
  const [approved, setApproved] = useState(false);
  const [message, setMessage] = useState('');
  const [projectId, setProjectId] = useState<string | null>(initialProjectId);
  const [textTasks, setTextTasks] = useState<TextTask[]>([]);
  const [jobs, setJobs] = useState<MediaJob[]>([]);
  const [voiceId, setVoiceId] = useState<string | null>(null);
  const [isStarting, startTransition] = useTransition();
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const snapshotRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restoredRef = useRef(!initialProjectId);

  const plan = useMemo(() => resolveBusinessRouterPlan(prompt), [prompt]);
  const paidOutputs = plan.outputs.filter((output) => PAID_OUTPUTS.has(output));
  const needsApproval = paidOutputs.length > 0;
  const busy =
    isStarting ||
    textTasks.some((task) => task.status === 'running') ||
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
    if (!initialProjectId) return;

    let cancelled = false;

    void loadLatestFactoryBundleSnapshotAction(initialProjectId).then((snapshot) => {
      if (cancelled) return;

      if (snapshot) {
        setPrompt(snapshot.prompt || initialPrompt);
        setApproved(snapshot.approved);
        setTextTasks(snapshot.textTasks as unknown as TextTask[]);
        setJobs(snapshot.jobs as unknown as MediaJob[]);
        setProjectId(initialProjectId);
        setMessage('Состояние проекта восстановлено. Незавершённые этапы продолжают проверяться.');
      }

      restoredRef.current = true;
    });

    return () => {
      cancelled = true;
    };
  }, [initialProjectId, initialPrompt]);

  useEffect(() => {
    if (!projectId || !restoredRef.current) return;
    if (!textTasks.length && !jobs.length) return;

    if (snapshotRef.current) clearTimeout(snapshotRef.current);

    snapshotRef.current = setTimeout(() => {
      void saveFactoryBundleSnapshotAction({
        projectId,
        snapshot: {
          prompt,
          approved,
          textTasks: textTasks as unknown as Array<Record<string, unknown>>,
          jobs: jobs as unknown as Array<Record<string, unknown>>,
        },
      });
    }, 900);

    return () => {
      if (snapshotRef.current) clearTimeout(snapshotRef.current);
    };
  }, [approved, jobs, projectId, prompt, textTasks]);

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

  const updateTextTask = (key: string, patch: Partial<TextTask>) => {
    setTextTasks((current) =>
      current.map((task) => (task.key === key ? { ...task, ...patch } : task)),
    );
  };

  const runTextTask = async (
    task: TextTask,
    activeProjectId: string | null,
    originalPrompt: string,
  ): Promise<{ projectId: string | null; content: string; ok: boolean }> => {
    updateTextTask(task.key, { status: 'running', error: '' });

    if (task.mode === 'website') {
      const result = await generateWebsiteArtifactAction({
        goal: originalPrompt,
        format: task.format,
        context:
          'Сайт — часть единой кампании Бизнес-завода. Сохраняй главный оффер, позиционирование и CTA.',
        projectId: activeProjectId,
      });

      if (result.status === 'failed') {
        updateTextTask(task.key, { status: 'failed', error: result.message });
        return { projectId: activeProjectId, content: '', ok: false };
      }

      const content = 'Сайт собран: ' + result.title;
      updateTextTask(task.key, {
        status: 'completed',
        content,
      });
      return { projectId: result.projectId, content, ok: true };
    }

    const result = await generateCreateStudioArtifactAction({
      modeId: task.mode,
      goal: originalPrompt,
      format: task.format,
      context: task.context,
      projectId: activeProjectId,
      title: task.title,
      artifactType: task.artifactType,
    });

    if (result.status === 'failed') {
      updateTextTask(task.key, { status: 'failed', error: result.message });
      return { projectId: activeProjectId, content: '', ok: false };
    }

    updateTextTask(task.key, {
      status: 'completed',
      content: result.content,
    });

    return { projectId: result.projectId, content: result.content, ok: true };
  };

  const runQaTask = async (activeProjectId: string) => {
    const qaTask = textTasks.find((task) => task.key === 'qa');
    if (!qaTask) return;

    updateTextTask('qa', { status: 'running', error: '' });

    const textContext = textTasks
      .filter((task) => task.key !== 'qa' && task.status === 'completed' && task.content)
      .map((task) => task.label + ':\n' + task.content.slice(0, 5000))
      .join('\n\n---\n\n');

    const mediaContext = jobs
      .filter((job) => job.status.status === 'completed')
      .map((job) => {
        const urls = job.status.outputUrls.length
          ? job.status.outputUrls
          : job.status.outputUrl
            ? [job.status.outputUrl]
            : [];
        return job.label + ': ' + (urls.join(', ') || job.status.providerStatus);
      })
      .join('\n');

    const result = await generateCreateStudioArtifactAction({
      modeId: 'document',
      goal: 'Проверь готовность полного комплекта по исходной задаче: ' + prompt.trim(),
      format: qaTask.format,
      context: [
        'ГОТОВЫЕ ТЕКСТОВЫЕ ЧАСТИ:',
        textContext || 'Нет текстовых частей.',
        '',
        'ГОТОВЫЕ МЕДИА:',
        mediaContext || 'Нет медиа-частей.',
        '',
        'Не переписывай весь комплект. Найди только реальные несостыковки. Если критичных проблем нет, прямо напиши «ПАКЕТ ГОТОВ К ВЫПУСКУ».',
      ].join('\n'),
      projectId: activeProjectId,
      title: qaTask.title,
      artifactType: qaTask.artifactType,
    });

    if (result.status === 'failed') {
      updateTextTask('qa', { status: 'failed', error: result.message });
      return;
    }

    updateTextTask('qa', {
      status: 'completed',
      content: result.content,
    });
  };

  const buildMediaSpecs = (
    trimmed: string,
    voiceScriptText = '',
  ): MediaLaunchSpec[] => {
    const specs: MediaLaunchSpec[] = [];

    if (plan.outputs.includes('video')) {
      specs.push({
        key: 'video',
        label: 'Reels / видео',
        kind: 'video',
        promptText:
          trimmed +
          '\nСобери вертикальный рекламный ролик как часть единой кампании. Сохрани главный оффер, визуальный мир и CTA.',
        ratio: '768:1280',
        duration: 5,
      });
    }

    if (plan.outputs.includes('image') || plan.outputs.includes('banner')) {
      specs.push({
        key: 'visual',
        label: plan.outputs.includes('banner') ? 'Главный баннер' : 'Главный визуал',
        kind: 'image',
        promptText:
          trimmed +
          '\nСоздай главный рекламный визуал кампании. Он должен соответствовать единому офферу, стилю и CTA.',
        ratio: '1080:1350',
      });
    }

    if (plan.outputs.includes('voice') && voiceId && voiceScriptText.trim()) {
      specs.push({
        key: 'voice',
        label: 'Озвучка',
        kind: 'voice',
        engine: 'studio',
        promptText: voiceScriptText.trim(),
        voiceId,
      });
    }

    if (plan.outputs.includes('music')) {
      specs.push({
        key: 'music',
        label: 'Музыка',
        kind: 'audio',
        engine: 'music',
        promptText:
          'Создай современный инструментальный трек для этой кампании. Музыка должна поддерживать темп, настроение и оффер: ' +
          trimmed,
        duration: 15,
      });
    }

    if (plan.outputs.includes('sfx')) {
      specs.push({
        key: 'sfx',
        label: 'Звуковые эффекты',
        kind: 'audio',
        engine: 'sfx',
        promptText:
          'Создай короткий звуковой эффект или атмосферу для рекламного ролика этой кампании: ' +
          trimmed,
        duration: 5,
      });
    }

    return specs;
  };

  const startMediaSpec = async (
    spec: MediaLaunchSpec,
    activeProjectId: string,
  ): Promise<MediaJob | { failure: string }> => {
    if (spec.engine === 'music') {
      const result = await generateMusicAction({
        prompt: spec.promptText,
        approved,
        durationSeconds: spec.duration ?? 15,
        instrumental: true,
        projectId: activeProjectId,
      });

      if (result.status !== 'completed') {
        return { failure: spec.label + ': ' + result.message };
      }

      return {
        key: spec.key + ':' + Date.now(),
        label: spec.label,
        kind: 'audio',
        id: 'music-completed',
        status: {
          status: 'completed',
          providerStatus: 'completed',
          outputUrl: result.outputUrl,
          outputUrls: [result.outputUrl],
          ephemeral: false,
          persisted: true,
          storagePath: result.storagePath,
        },
        spec,
      };
    }

    if (spec.engine === 'sfx') {
      const result = await startSoundEffectAction({
        promptText: spec.promptText,
        approved,
        duration: spec.duration ?? 5,
        loop: false,
        projectId: activeProjectId,
      });

      if (result.status !== 'started') {
        return { failure: spec.label + ': ' + result.message };
      }

      return {
        key: spec.key + ':' + result.id,
        label: spec.label,
        kind: 'audio',
        id: result.id,
        status: pendingStatus(),
        spec,
      };
    }

    const result = await startMediaGenerationAction({
      kind: spec.kind,
      promptText: spec.promptText,
      approved,
      ratio: spec.ratio,
      duration: spec.duration,
      voiceId: spec.voiceId,
      projectId: activeProjectId,
    });

    if (result.status !== 'started') {
      return { failure: spec.label + ': ' + result.message };
    }

    return {
      key: spec.key + ':' + result.id,
      label: spec.label,
      kind: spec.kind,
      id: result.id,
      status: pendingStatus(),
      spec,
    };
  };

  const retryMediaJob = (job: MediaJob) => {
    if (!projectId || job.status.status !== 'failed') return;

    startTransition(async () => {
      const restarted = await startMediaSpec(job.spec, projectId);

      if ('failure' in restarted) {
        setMessage(restarted.failure);
        return;
      }

      setJobs((current) =>
        current.map((item) => (item.key === job.key ? restarted : item)),
      );
      setMessage('Повторно запущен только этап «' + job.label + '».');
    });
  };

  const retryTextTask = (task: TextTask) => {
    if (!projectId || task.status !== 'failed') return;

    startTransition(async () => {
      if (task.key === 'qa') {
        await runQaTask(projectId);
      } else {
        const result = await runTextTask(task, projectId, prompt.trim());

        if (
          task.key === 'voice-script' &&
          result.ok &&
          !jobs.some((job) => job.spec.key === 'voice')
        ) {
          const voiceSpec = buildMediaSpecs(prompt.trim(), result.content).find(
            (spec) => spec.key === 'voice',
          );

          if (voiceSpec) {
            const restarted = await startMediaSpec(voiceSpec, projectId);
            if ('failure' in restarted) {
              setMessage(restarted.failure);
              return;
            }
            setJobs((current) => [...current, restarted]);
          }
        }
      }
      setMessage('Повторно запущен только этап «' + task.label + '».');
    });
  };
  const handoffToPublish = (task: TextTask) => {
    if (!projectId || task.status !== 'completed' || !task.content.trim()) return;

    window.sessionStorage.setItem('business-zavod:publish-source', task.content);
    window.location.href = '/modules/publish/studio?project=' + encodeURIComponent(projectId);
  };


  const start = () => {
    const trimmed = prompt.trim();

    if (!trimmed || plan.kind !== 'factory_bundle' || busy) return;

    if (needsApproval && !approved) {
      setMessage('Подтвердите платные генерации для медиа-цехов.');
      return;
    }

    setMessage('');
    setJobs([]);

    const tasks = buildTextTasks(plan.outputs);
    setTextTasks(tasks);

    startTransition(async () => {
      const bundlePrompt = buildFactoryBundlePrompt(plan, trimmed);
      const strategyTask = tasks.find((task) => task.key === 'strategy')!;

      updateTextTask(strategyTask.key, { status: 'running' });

      const strategy = await generateCreateStudioArtifactAction({
        modeId: 'document',
        goal: bundlePrompt,
        format: strategyTask.format,
        title: strategyTask.title,
        artifactType: strategyTask.artifactType,
      });

      if (strategy.status === 'failed') {
        updateTextTask(strategyTask.key, {
          status: 'failed',
          error: strategy.message,
        });
        setMessage('Не удалось создать базовую стратегию. Остальные этапы не запущены.');
        return;
      }

      const activeProjectId = strategy.projectId;
      setProjectId(activeProjectId);
      restoredRef.current = true;
      router.replace('/modules/factory?project=' + encodeURIComponent(activeProjectId));
      updateTextTask(strategyTask.key, {
        status: 'completed',
        content: strategy.content,
      });

      const otherTextTasks = tasks.filter(
        (task) => task.key !== 'strategy' && task.key !== 'qa',
      );

      const textResults = await Promise.all(
        otherTextTasks.map((task) => runTextTask(task, activeProjectId, trimmed)),
      );

      const voiceTaskIndex = otherTextTasks.findIndex(
        (task) => task.key === 'voice-script',
      );
      const voiceScriptText =
        voiceTaskIndex >= 0 ? textResults[voiceTaskIndex]?.content ?? '' : '';

      const mediaSpecs = buildMediaSpecs(trimmed, voiceScriptText);
      const started = await Promise.all(
        mediaSpecs.map((spec) => startMediaSpec(spec, activeProjectId)),
      );

      const nextJobs: MediaJob[] = [];
      const failures: string[] = [];

      for (const item of started) {
        if ('failure' in item) failures.push(item.failure);
        else nextJobs.push(item);
      }

      setJobs(nextJobs);

      if (failures.length) {
        setMessage('Пакет собран частично. Не запустились: ' + failures.join(' · '));
      } else if (nextJobs.length) {
        setMessage('Текстовые результаты готовы. Медиа-цеха работают параллельно.');
      } else {
        setMessage('Пакет собран и сохранён отдельными результатами проекта.');
      }
    });
  };

  useEffect(() => {
    if (!projectId) return;

    const qaTask = textTasks.find((task) => task.key === 'qa');
    if (!qaTask || qaTask.status !== 'queued') return;

    const productionTextTasks = textTasks.filter((task) => task.key !== 'qa');
    if (!productionTextTasks.length) return;
    if (!productionTextTasks.every((task) => task.status === 'completed')) return;

    const voiceScriptText =
      textTasks.find((task) => task.key === 'voice-script')?.content ?? '';
    const expectedMediaCount = buildMediaSpecs(prompt.trim(), voiceScriptText).length;
    if (expectedMediaCount > 0 && jobs.length < expectedMediaCount) return;
    if (!jobs.every((job) => job.status.status === 'completed')) return;

    void runQaTask(projectId);
  }, [jobs, projectId, prompt, textTasks]);

  const completedMedia = jobs.filter((job) => job.status.status === 'completed').length;
  const completedText = textTasks.filter((task) => task.status === 'completed').length;
  const failedCount =
    textTasks.filter((task) => task.status === 'failed').length +
    jobs.filter((job) => job.status.status === 'failed').length;
  const qaTask = textTasks.find((task) => task.key === 'qa');
  const packageReady = qaTask?.status === 'completed' && failedCount === 0;

  return (
    <main className="mx-auto w-full max-w-[1380px] pb-16 text-[#f7f2e8]">
      <section className="overflow-hidden rounded-[34px] border border-white/[0.09] bg-[linear-gradient(145deg,#05070b,#0b1018_58%,#06080c)] p-6 sm:p-8">
        <p className="text-[12px] font-black uppercase tracking-[.18em] text-[#79eaf2]">
          БИЗНЕС-ЗАВОД · АВТОМАРШРУТ
        </p>
        <h1 className="mt-3 text-[clamp(2.6rem,5vw,5rem)] font-black leading-[.94] tracking-[-.055em] text-[#fff8e7]">
          Одна идея.
          <span className="block text-[#f1c96c]">Полный комплект контента.</span>
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-white/58">
          Завод сам разбивает задачу на независимые этапы, сохраняет каждый результат отдельно и не пересобирает готовые части из-за одной ошибки.
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
              placeholder="Например: сделай полный пакет запуска услуги под ключ"
              className="resize-none rounded-[20px] border border-white/[0.09] bg-black/25 px-4 py-4 text-sm leading-6 text-white outline-none"
            />
          </label>

          <div className="mt-5">
            <p className="text-xs font-black uppercase tracking-[.14em] text-white/46">
              ЧТО БУДЕТ СОЗДАНО
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
                Подтверждаю запуск платных медиа-генераций и возможное списание кредитов.
              </span>
            </label>
          ) : null}

          <button
            type="button"
            onClick={start}
            disabled={busy || plan.kind !== 'factory_bundle' || (needsApproval && !approved)}
            className="mt-5 w-full rounded-[18px] bg-[linear-gradient(135deg,#ffe08a,#d79a30)] px-5 py-4 text-sm font-black text-[#1b1105] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-35"
          >
            {busy ? 'Завод работает…' : 'Собрать весь комплект →'}
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
              <h2 className="mt-2 text-2xl font-black text-[#fff8e7]">Комплект проекта</h2>
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

          {!projectId && !textTasks.length ? (
            <div className="flex min-h-[430px] items-center justify-center text-center">
              <div>
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[24px] border border-[#69e4ee]/12 bg-[#69e4ee]/[0.035] text-xl font-black text-[#79eaf2]">
                  AI
                </div>
                <p className="mt-5 text-xl font-black text-[#fff8e7]">Готов к запуску</p>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/46">
                  Напишите идею или попросите «полный пакет под ключ» — завод сам определит комплект.
                </p>
              </div>
            </div>
          ) : null}

          {textTasks.length ? (
            <div className="mt-5 grid gap-3">
              {textTasks.map((task) => (
                <article
                  key={task.key}
                  className="rounded-[20px] border border-white/[0.07] bg-white/[0.025] p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm font-black text-[#fff8e7]">{task.label}</p>
                    <span
                      className={[
                        'text-xs font-bold',
                        task.status === 'completed'
                          ? 'text-emerald-200/80'
                          : task.status === 'failed'
                            ? 'text-red-200/80'
                            : 'text-[#8ceaf2]/70',
                      ].join(' ')}
                    >
                      {task.status === 'queued'
                        ? 'в очереди'
                        : task.status === 'running'
                          ? 'создаётся'
                          : task.status === 'completed'
                            ? 'готово'
                            : 'ошибка'}
                    </span>
                  </div>

                  {task.status === 'completed' && task.content ? (
                    <>
                      <pre className="mt-3 max-h-[240px] overflow-auto whitespace-pre-wrap font-sans text-xs leading-6 text-white/60">
                        {task.content}
                      </pre>
                      {['stories', 'post', 'telegram', 'document'].includes(task.key) ? (
                        <button
                          type="button"
                          onClick={() => handoffToPublish(task)}
                          className="mt-3 rounded-xl border border-[#69e4ee]/18 bg-[#69e4ee]/[0.04] px-3 py-2 text-xs font-black text-[#a8f3f8]"
                        >
                          К публикации →
                        </button>
                      ) : null}
                    </>
                  ) : null}

                  {task.status === 'failed' ? (
                    <div className="mt-3">
                      <p className="text-xs leading-5 text-red-100/60">{task.error}</p>
                      <button
                        type="button"
                        onClick={() => retryTextTask(task)}
                        className="mt-3 rounded-xl border border-red-200/15 px-3 py-2 text-xs font-black text-red-100/75"
                      >
                        Повторить только этот этап
                      </button>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          ) : null}

          {jobs.length ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
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
                  ) : job.status.status === 'failed' ? (
                    <button
                      type="button"
                      onClick={() => retryMediaJob(job)}
                      className="mt-3 rounded-xl border border-red-200/15 px-3 py-2 text-xs font-black text-red-100/75"
                    >
                      Повторить только этот этап
                    </button>
                  ) : (
                    <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                      <div className="h-full w-2/3 animate-pulse rounded-full bg-[#69e4ee]" />
                    </div>
                  )}
                </article>
              ))}
            </div>
          ) : null}

          {textTasks.length || jobs.length ? (
            <div className="mt-5 rounded-[18px] border border-white/[0.06] bg-black/20 px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-white/45">
                  Текстовые этапы: {completedText}/{textTasks.length}. Медиа: {completedMedia}/{jobs.length}.
                  {failedCount ? ' Ошибок: ' + failedCount + ' — готовые этапы не затрагиваются.' : ''}
                </div>
                <span
                  className={[
                    'rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[.12em]',
                    packageReady
                      ? 'border-emerald-300/18 bg-emerald-300/[0.05] text-emerald-200/90'
                      : 'border-white/[0.08] bg-white/[0.025] text-white/38',
                  ].join(' ')}
                >
                  {packageReady ? 'ПАКЕТ ГОТОВ' : 'ПРОВЕРКА НЕ ЗАВЕРШЕНА'}
                </span>
              </div>
              {projectId && completedText > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href={'/modules/publish/studio?project=' + encodeURIComponent(projectId)}
                    className="rounded-xl bg-[linear-gradient(135deg,#69e4ee,#399fb5)] px-3 py-2 text-xs font-black text-[#041015]"
                  >
                    Открыть цех публикации →
                  </Link>
                  <Link
                    href={'/media?project=' + encodeURIComponent(projectId)}
                    className="rounded-xl border border-white/[0.10] px-3 py-2 text-xs font-black text-white/68"
                  >
                    Медиа проекта →
                  </Link>
                </div>
              ) : null}
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
