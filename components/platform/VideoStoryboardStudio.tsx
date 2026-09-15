
'use client';

import { useMemo, useState, useTransition } from 'react';

import {
  getMediaGenerationStatusAction,
  listMediaVoicesAction,
  refreshMediaAssetUrlAction,
  startMediaGenerationAction,
} from '@/app/(dashboard)/modules/create/studio/actions';
import {
  buildStoryboardPlanAction,
  type StoryboardPlanScene,
} from '@/app/(dashboard)/modules/create/studio/storyboard-actions';
import { FinalVideoExportPanel } from '@/components/platform/FinalVideoExportPanel';
import { StoryboardRemotionPreview } from '@/components/platform/StoryboardRemotionPreview';

type VideoStoryboardStudioProps = {
  goal: string;
  audience: string;
  format: string;
  context: string;
};

type RuntimeScene = StoryboardPlanScene & {
  taskId: string | null;
  status: 'idle' | 'pending' | 'running' | 'completed' | 'failed';
  videoUrl: string | null;
  storagePath: string | null;
};

type VoiceOption = {
  id: string;
  name: string;
  category: string;
  previewUrl: string | null;
};

type SavedDraft = {
  title: string;
  style: string;
  durationSeconds: number;
  scenes: RuntimeScene[];
  voiceId: string;
  voiceUrl: string | null;
  voiceStoragePath: string | null;
};

const DRAFT_KEY = 'business-zavod:video-storyboard:v1';

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeSceneDuration(seconds: number) {
  return seconds <= 5 ? 5 : 10;
}

function scenePrompt(scene: RuntimeScene, style: string, context: string) {
  return [
    scene.visualPrompt,
    'Continuity: keep exactly the same people, room, props, wardrobe, product, lighting and color palette as all adjacent scenes.',
    style ? 'Global style: ' + style : '',
    context ? 'Constraints: ' + context : '',
    'Shot type: ' + scene.shotType + '.',
    'Camera: ' + scene.camera + '.',
    'Lighting: ' + scene.lighting + '.',
    'No captions, no logos, no watermarks, no random text inside the generated footage.',
  ]
    .filter(Boolean)
    .join(' ');
}

export function VideoStoryboardStudio({
  goal,
  audience,
  format,
  context,
}: VideoStoryboardStudioProps) {
  const [durationSeconds, setDurationSeconds] = useState(25);
  const [title, setTitle] = useState('');
  const [style, setStyle] = useState('');
  const [scenes, setScenes] = useState<RuntimeScene[]>([]);
  const [approved, setApproved] = useState(false);
  const [error, setError] = useState('');
  const [isPlanning, startPlanning] = useTransition();
  const [isGenerating, startGenerating] = useTransition();
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [voiceId, setVoiceId] = useState('');
  const [voiceTaskId, setVoiceTaskId] = useState('');
  const [voiceUrl, setVoiceUrl] = useState<string | null>(null);
  const [voiceStoragePath, setVoiceStoragePath] = useState<string | null>(null);
  const [voiceStatus, setVoiceStatus] = useState<
    'idle' | 'pending' | 'running' | 'completed' | 'failed'
  >('idle');
  const [isLoadingVoices, startVoiceLoading] = useTransition();

  const completedScenes = useMemo(
    () => scenes.filter((scene) => scene.status === 'completed' && scene.videoUrl),
    [scenes],
  );

  const narration = useMemo(
    () =>
      scenes
        .map((scene) => scene.narration.trim())
        .filter(Boolean)
        .join(' '),
    [scenes],
  );

  const previewScenes = useMemo(
    () =>
      completedScenes.map((scene) => ({
        id: scene.id,
        title: scene.title,
        durationSeconds: scene.durationSeconds,
        videoUrl: scene.videoUrl as string,
        narration: scene.narration,
      })),
    [completedScenes],
  );

  const updateScene = (sceneId: string, patch: Partial<RuntimeScene>) => {
    setScenes((current) =>
      current.map((scene) => (scene.id === sceneId ? { ...scene, ...patch } : scene)),
    );
  };

  const buildPlan = () => {
    if (!goal.trim()) {
      setError('Сначала опишите идею ролика выше.');
      return;
    }

    setError('');

    startPlanning(async () => {
      const result = await buildStoryboardPlanAction({
        goal,
        audience,
        format,
        context,
        durationSeconds,
      });

      if (result.status !== 'ok') {
        setError(result.message);
        return;
      }

      setTitle(result.title);
      setStyle(result.style);
      setScenes(
        result.scenes.map((scene) => ({
          ...scene,
          taskId: null,
          status: 'idle',
          videoUrl: null,
          storagePath: null,
        })),
      );
      setVoiceTaskId('');
      setVoiceUrl(null);
      setVoiceStoragePath(null);
      setVoiceStatus('idle');
      setApproved(false);
    });
  };

  const pollScene = async (sceneId: string, taskId: string) => {
    for (let attempt = 0; attempt < 80; attempt += 1) {
      await sleep(3000);
      const status = await getMediaGenerationStatusAction('video', taskId);

      if (status.status === 'running' || status.status === 'pending') {
        updateScene(sceneId, { status: status.status });
        continue;
      }

      if (status.status === 'completed' && status.outputUrl) {
        updateScene(sceneId, {
          status: 'completed',
          videoUrl: status.outputUrl,
          storagePath: status.storagePath ?? null,
        });
        return true;
      }

      updateScene(sceneId, { status: 'failed' });
      return false;
    }

    updateScene(sceneId, { status: 'failed' });
    return false;
  };

  const generateAllScenes = () => {
    if (!approved || scenes.length === 0 || isGenerating) return;

    setError('');

    startGenerating(async () => {
      for (const scene of scenes) {
        if (scene.status === 'completed' && scene.videoUrl) continue;

        updateScene(scene.id, { status: 'pending', taskId: null, videoUrl: null, storagePath: null });

        const start = await startMediaGenerationAction({
          kind: 'video',
          promptText: scenePrompt(scene, style, context),
          approved: true,
          ratio: '768:1280',
          duration: normalizeSceneDuration(scene.durationSeconds),
        });

        if (start.status !== 'started') {
          updateScene(scene.id, { status: 'failed' });
          setError(start.message);
          return;
        }

        updateScene(scene.id, { status: 'pending', taskId: start.id });
        const ok = await pollScene(scene.id, start.id);

        if (!ok) {
          setError('Одна из сцен не сгенерировалась. Её можно перезапустить отдельно.');
          return;
        }
      }
    });
  };

  const generateOneScene = (scene: RuntimeScene) => {
    if (!approved || isGenerating) return;

    setError('');

    startGenerating(async () => {
      updateScene(scene.id, { status: 'pending', taskId: null, videoUrl: null, storagePath: null });
      const start = await startMediaGenerationAction({
        kind: 'video',
        promptText: scenePrompt(scene, style, context),
        approved: true,
        ratio: '768:1280',
        duration: normalizeSceneDuration(scene.durationSeconds),
      });

      if (start.status !== 'started') {
        updateScene(scene.id, { status: 'failed' });
        setError(start.message);
        return;
      }

      updateScene(scene.id, { status: 'pending', taskId: start.id });
      await pollScene(scene.id, start.id);
    });
  };

  const loadVoices = () => {
    startVoiceLoading(async () => {
      const loaded = await listMediaVoicesAction();
      setVoices(loaded);
      setVoiceId((current) => current || loaded[0]?.id || '');
      if (loaded.length === 0) setError('Список голосов не загрузился.');
    });
  };

  const generateVoice = () => {
    if (!approved || !voiceId || !narration || voiceStatus === 'running') return;

    setError('');
    setVoiceStatus('pending');
    setVoiceUrl(null);

    startGenerating(async () => {
      const start = await startMediaGenerationAction({
        kind: 'voice',
        promptText: narration,
        approved: true,
        voiceId,
      });

      if (start.status !== 'started') {
        setVoiceStatus('failed');
        setError(start.message);
        return;
      }

      setVoiceTaskId(start.id);

      for (let attempt = 0; attempt < 80; attempt += 1) {
        await sleep(2500);
        const status = await getMediaGenerationStatusAction('voice', start.id);
        setVoiceStatus(status.status);

        if (status.status === 'completed' && status.outputUrl) {
          setVoiceUrl(status.outputUrl);
          setVoiceStoragePath(status.storagePath ?? null);
          return;
        }

        if (status.status === 'failed') {
          setError('Озвучка не сгенерировалась: ' + status.providerStatus);
          return;
        }
      }

      setVoiceStatus('failed');
      setError('Озвучка не успела завершиться в окне ожидания.');
    });
  };

  const saveDraft = () => {
    const draft: SavedDraft = {
      title,
      style,
      durationSeconds,
      scenes,
      voiceId,
      voiceUrl,
      voiceStoragePath,
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  };

  const restoreDraft = async () => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) {
        setError('Сохранённый черновик не найден.');
        return;
      }

      const draft = JSON.parse(raw) as SavedDraft;
      setTitle(draft.title || '');
      setStyle(draft.style || '');
      setDurationSeconds(draft.durationSeconds || 25);

      const restoredScenes = Array.isArray(draft.scenes) ? draft.scenes : [];
      const refreshedScenes = await Promise.all(
        restoredScenes.map(async (scene) => {
          if (!scene.storagePath) return scene;
          const refreshedUrl = await refreshMediaAssetUrlAction(scene.storagePath);
          return {
            ...scene,
            videoUrl: refreshedUrl || scene.videoUrl,
            status: refreshedUrl ? 'completed' : scene.status,
          } as RuntimeScene;
        }),
      );

      setScenes(refreshedScenes);
      setVoiceId(draft.voiceId || '');

      const refreshedVoiceUrl = draft.voiceStoragePath
        ? await refreshMediaAssetUrlAction(draft.voiceStoragePath)
        : null;
      setVoiceUrl(refreshedVoiceUrl || draft.voiceUrl || null);
      setVoiceStoragePath(draft.voiceStoragePath || null);
      setVoiceStatus(refreshedVoiceUrl || draft.voiceUrl ? 'completed' : 'idle');
      setError('');
    } catch {
      setError('Черновик повреждён и не может быть восстановлен.');
    }
  };

  return (
    <section className="mt-5 rounded-[30px] border border-white/[0.08] bg-[linear-gradient(145deg,#080b11,#0d1119)] p-5 text-white sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#e7b952]">
            Многосценовый ролик
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#fff8e7]">
            Раскадровка → сцены → озвучка → предпросмотр
          </h2>
          <p className="mt-2 max-w-3xl text-xs leading-5 text-white/38">
            AI сначала строит связную раскадровку. После подтверждения сцены генерируются
            последовательно, чтобы было видно, на какой операции расходуются кредиты.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={saveDraft}
            disabled={scenes.length === 0}
            className="rounded-xl border border-white/[0.08] px-3 py-2 text-[10px] font-semibold text-white/45 disabled:opacity-30"
          >
            Сохранить черновик
          </button>
          <button
            type="button"
            onClick={restoreDraft}
            className="rounded-xl border border-white/[0.08] px-3 py-2 text-[10px] font-semibold text-white/45"
          >
            Восстановить
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-[180px_1fr]">
        <label className="grid gap-2">
          <span className="text-[11px] font-semibold text-white/55">Общий хронометраж</span>
          <select
            value={durationSeconds}
            onChange={(event) => setDurationSeconds(Number(event.target.value))}
            className="rounded-2xl border border-white/[0.08] bg-[#0a0e15] px-3 py-3 text-xs text-white outline-none"
          >
            {[10, 15, 20, 25, 30, 45, 60].map((seconds) => (
              <option key={seconds} value={seconds}>
                {seconds} сек.
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-end">
          <button
            type="button"
            onClick={buildPlan}
            disabled={!goal.trim() || isPlanning}
            className="w-full rounded-[18px] bg-[linear-gradient(135deg,#f2d474,#c68a26)] px-5 py-3.5 text-sm font-extrabold text-[#181006] disabled:opacity-35"
          >
            {isPlanning ? 'AI строит раскадровку…' : 'Собрать раскадровку'}
          </button>
        </div>
      </div>

      {scenes.length > 0 ? (
        <>
          <div className="mt-5 rounded-[22px] border border-[#58dbe8]/10 bg-[#58dbe8]/[0.03] p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-[10px] font-semibold text-white/45">Название</span>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="rounded-xl border border-white/[0.07] bg-black/20 px-3 py-2.5 text-xs text-white outline-none"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-[10px] font-semibold text-white/45">Единый стиль</span>
                <input
                  value={style}
                  onChange={(event) => setStyle(event.target.value)}
                  className="rounded-xl border border-white/[0.07] bg-black/20 px-3 py-2.5 text-xs text-white outline-none"
                />
              </label>
            </div>

            <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-[18px] border border-[#e7b952]/13 bg-[#e7b952]/[0.035] p-3.5">
              <input
                type="checkbox"
                checked={approved}
                onChange={(event) => setApproved(event.target.checked)}
                className="mt-0.5 h-4 w-4 accent-[#e7b952]"
              />
              <span className="text-[11px] leading-5 text-white/48">
                <strong className="block text-[#f2d474]">
                  Подтверждаю платную генерацию сцен и озвучки
                </strong>
                До {scenes.length + 1} внешних генераций: {scenes.length} сцен и одна
                озвучка, если её запустить.
              </span>
            </label>

            <button
              type="button"
              onClick={generateAllScenes}
              disabled={!approved || isGenerating}
              className="mt-3 w-full rounded-[17px] bg-[linear-gradient(135deg,#58dbe8,#338eaa)] px-4 py-3 text-xs font-extrabold text-[#041015] disabled:opacity-30"
            >
              {isGenerating ? 'Производство идёт…' : 'Сгенерировать все сцены по очереди'}
            </button>
          </div>

          <div className="mt-5 grid gap-3">
            {scenes.map((scene) => (
              <article
                key={scene.id}
                className="rounded-[22px] border border-white/[0.07] bg-white/[0.025] p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-white/25">
                      Сцена {scene.order} · {scene.durationSeconds} сек.
                    </p>
                    <input
                      value={scene.title}
                      onChange={(event) =>
                        updateScene(scene.id, { title: event.target.value })
                      }
                      className="mt-1 w-full bg-transparent text-sm font-semibold text-[#fff8e7] outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="rounded-full border border-white/[0.07] px-2.5 py-1 text-[9px] text-white/35">
                      {scene.status === 'completed'
                        ? 'готово'
                        : scene.status === 'running'
                          ? 'генерируется'
                          : scene.status === 'pending'
                            ? 'очередь'
                            : scene.status === 'failed'
                              ? 'ошибка'
                              : 'черновик'}
                    </span>
                    <button
                      type="button"
                      onClick={() => generateOneScene(scene)}
                      disabled={!approved || isGenerating}
                      className="rounded-lg border border-[#58dbe8]/15 px-2.5 py-1 text-[9px] font-semibold text-[#8ceaf2] disabled:opacity-30"
                    >
                      {scene.videoUrl ? 'Перегенерировать' : 'Сгенерировать'}
                    </button>
                  </div>
                </div>

                <div className="mt-3 grid gap-3 lg:grid-cols-[1.2fr_.8fr]">
                  <label className="grid gap-1.5">
                    <span className="text-[9px] font-semibold text-white/30">
                      Визуальный промпт
                    </span>
                    <textarea
                      value={scene.visualPrompt}
                      onChange={(event) =>
                        updateScene(scene.id, { visualPrompt: event.target.value })
                      }
                      rows={4}
                      className="resize-none rounded-xl border border-white/[0.06] bg-black/20 px-3 py-2.5 text-[11px] leading-5 text-white/60 outline-none"
                    />
                  </label>

                  <label className="grid gap-1.5">
                    <span className="text-[9px] font-semibold text-white/30">
                      Субтитр / озвучка
                    </span>
                    <textarea
                      value={scene.narration}
                      onChange={(event) =>
                        updateScene(scene.id, { narration: event.target.value })
                      }
                      rows={4}
                      className="resize-none rounded-xl border border-white/[0.06] bg-black/20 px-3 py-2.5 text-[11px] leading-5 text-white/60 outline-none"
                    />
                  </label>
                </div>

                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  {[
                    ['shotType', 'Кадр'],
                    ['camera', 'Камера'],
                    ['lighting', 'Свет'],
                  ].map(([field, label]) => (
                    <label key={field} className="grid gap-1">
                      <span className="text-[9px] text-white/25">{label}</span>
                      <input
                        value={String(scene[field as 'shotType' | 'camera' | 'lighting'])}
                        onChange={(event) =>
                          updateScene(scene.id, {
                            [field]: event.target.value,
                          } as Partial<RuntimeScene>)
                        }
                        className="rounded-lg border border-white/[0.05] bg-black/15 px-2.5 py-2 text-[10px] text-white/45 outline-none"
                      />
                    </label>
                  ))}
                </div>

                {scene.videoUrl ? (
                  <video
                    className="mt-3 max-h-[360px] w-full rounded-[16px] bg-black object-contain"
                    controls
                    playsInline
                    src={scene.videoUrl}
                  />
                ) : null}
              </article>
            ))}
          </div>

          <div className="mt-5 rounded-[22px] border border-white/[0.07] bg-white/[0.02] p-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.17em] text-[#e7b952]">
                  Озвучка
                </p>
                <p className="mt-1 text-[11px] text-white/34">
                  Текст берётся из поля «Субтитр / озвучка» каждой сцены.
                </p>
              </div>
              {voices.length === 0 ? (
                <button
                  type="button"
                  onClick={loadVoices}
                  disabled={isLoadingVoices}
                  className="rounded-xl border border-white/[0.08] px-3 py-2 text-[10px] text-white/45"
                >
                  {isLoadingVoices ? 'Загружаю…' : 'Загрузить голоса'}
                </button>
              ) : null}
            </div>

            {voices.length > 0 ? (
              <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
                <select
                  value={voiceId}
                  onChange={(event) => setVoiceId(event.target.value)}
                  className="rounded-xl border border-white/[0.07] bg-[#0a0e15] px-3 py-2.5 text-xs text-white outline-none"
                >
                  {voices.map((voice) => (
                    <option key={voice.id} value={voice.id}>
                      {voice.name}
                      {voice.category ? ' · ' + voice.category : ''}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={generateVoice}
                  disabled={!approved || !voiceId || !narration || isGenerating}
                  className="rounded-xl bg-[#e7b952] px-4 py-2.5 text-xs font-extrabold text-[#181006] disabled:opacity-30"
                >
                  {voiceStatus === 'running' || voiceStatus === 'pending'
                    ? 'Озвучка создаётся…'
                    : voiceUrl
                      ? 'Перегенерировать озвучку'
                      : 'Сгенерировать озвучку'}
                </button>
              </div>
            ) : null}

            {voiceTaskId ? (
              <p className="mt-2 truncate text-[9px] text-white/18">Voice task: {voiceTaskId}</p>
            ) : null}

            {voiceUrl ? (
              <audio className="mt-3 w-full" controls src={voiceUrl}>
                Озвучка недоступна.
              </audio>
            ) : null}
          </div>

          {previewScenes.length > 0 ? (
            <>
            <div className="mt-5 grid gap-4 xl:grid-cols-[.72fr_1.28fr]">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#58dbe8]">
                  Remotion Preview
                </p>
                <h3 className="mt-2 text-xl font-semibold text-[#fff8e7]">
                  Единый предпросмотр с субтитрами
                </h3>
                <p className="mt-2 text-xs leading-5 text-white/34">
                  Готовые сцены собираются на одной тайм-линии. Субтитры уже накладываются
                  поверх видео. Если создана озвучка, она подключается как общая аудиодорожка.
                </p>
                <p className="mt-3 text-[10px] text-white/22">
                  Готово сцен: {completedScenes.length} / {scenes.length}
                </p>
              </div>

              <StoryboardRemotionPreview scenes={previewScenes} voiceUrl={voiceUrl} />
            </div>

            {completedScenes.length === scenes.length ? (
              <FinalVideoExportPanel
                title={title || goal || 'Видео Бизнес-Завода'}
                scenes={previewScenes}
                voiceUrl={voiceUrl}
              />
            ) : null}
            </>
          ) : null}
        </>
      ) : null}

      {error ? (
        <p className="mt-4 rounded-2xl border border-red-300/10 bg-red-300/[0.04] px-3 py-2.5 text-[11px] leading-5 text-red-100/70">
          {error}
        </p>
      ) : null}
    </section>
  );
}
