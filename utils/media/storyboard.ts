export type StoryboardRatio = '16:9' | '9:16' | '1:1' | '4:3' | '3:4';

export type StoryboardSceneVersion = {
  id: string;
  createdAt: string;
  status: 'pending' | 'generating' | 'ready' | 'failed';
  imageUrl: string | null;
  videoUrl: string | null;
  voiceUrl: string | null;
  providerTaskIds: string[];
  note: string | null;
};

export type StoryboardScene = {
  id: string;
  order: number;
  title: string;
  durationSeconds: number;
  visualPrompt: string;
  narration: string;
  dialogue: string | null;
  shotType: string;
  camera: string;
  lighting: string;
  activeVersionId: string | null;
  versions: StoryboardSceneVersion[];
};

export type StoryboardProject = {
  id: string;
  title: string;
  goal: string;
  status: 'draft' | 'approved' | 'generating' | 'ready' | 'failed';
  ratio: StoryboardRatio;
  durationSeconds: number;
  style: string | null;
  approvedForPaidGeneration: boolean;
  outputTargets: StoryboardRatio[];
  scenes: StoryboardScene[];
};

type CreateStoryboardDraftInput = {
  title: string;
  goal: string;
  durationSeconds: number;
  ratio: StoryboardRatio;
  style?: string;
};

type StoryboardPromptInput = {
  goal: string;
  audience?: string;
  durationSeconds: number;
  ratio: StoryboardRatio;
  style?: string;
};

function clampDuration(value: number): number {
  if (!Number.isFinite(value)) return 10;
  return Math.min(180, Math.max(4, Math.round(value)));
}

function buildSceneDurations(totalSeconds: number): number[] {
  const safe = clampDuration(totalSeconds);
  const sceneCount = Math.max(1, Math.min(24, Math.ceil(safe / 5)));
  const base = Math.floor(safe / sceneCount);
  let remainder = safe - base * sceneCount;

  return Array.from({ length: sceneCount }, () => {
    const extra = remainder > 0 ? 1 : 0;
    remainder -= extra;
    return base + extra;
  });
}

export function createStoryboardDraft(
  input: CreateStoryboardDraftInput,
): StoryboardProject {
  const durationSeconds = clampDuration(input.durationSeconds);
  const durations = buildSceneDurations(durationSeconds);

  return {
    id: crypto.randomUUID(),
    title: input.title.trim() || 'Новый медиапроект',
    goal: input.goal.trim(),
    status: 'draft',
    ratio: input.ratio,
    durationSeconds,
    style: input.style?.trim() || null,
    approvedForPaidGeneration: false,
    outputTargets:
      input.ratio === '9:16'
        ? ['9:16', '16:9']
        : input.ratio === '16:9'
          ? ['16:9', '9:16']
          : [input.ratio],
    scenes: durations.map((duration, index) => ({
      id: crypto.randomUUID(),
      order: index + 1,
      title: `Сцена ${index + 1}`,
      durationSeconds: duration,
      visualPrompt: '',
      narration: '',
      dialogue: null,
      shotType: 'medium',
      camera: 'static',
      lighting: 'natural',
      activeVersionId: null,
      versions: [],
    })),
  };
}

export function buildStoryboardPrompt(input: StoryboardPromptInput): string {
  const lines = [
    'Собери подробную раскадровку медиапроекта.',
    `Цель: ${input.goal.trim()}`,
    `Хронометраж: ${clampDuration(input.durationSeconds)} секунд`,
    `Формат: ${input.ratio}`,
  ];

  if (input.audience?.trim()) {
    lines.push(`Аудитория: ${input.audience.trim()}`);
  }

  if (input.style?.trim()) {
    lines.push(`Стиль: ${input.style.trim()}`);
  }

  lines.push(
    '',
    'Разбей проект на сцены примерно по 3–6 секунд.',
    'Для каждой сцены опиши: цель сцены, визуальный промпт, тип кадра, камера и её движение, свет, текст озвучки, диалог при наличии и ожидаемый переход.',
    'Сохраняй единый стиль, персонажей, продукт и визуальную непрерывность между сценами.',
    'Ничего не генерируй и не запускай платные действия — сначала только план.',
    'Верни только JSON с полями: title, style, scenes[].',
  );

  return lines.join('\n');
}

export function activateSceneVersion(
  board: StoryboardProject,
  sceneId: string,
  version: StoryboardSceneVersion,
): StoryboardProject {
  return {
    ...board,
    scenes: board.scenes.map((scene) => {
      if (scene.id !== sceneId) return scene;

      const versions = [
        ...scene.versions.filter((item) => item.id !== version.id),
        version,
      ];

      return {
        ...scene,
        versions,
        activeVersionId: version.id,
      };
    }),
  };
}
