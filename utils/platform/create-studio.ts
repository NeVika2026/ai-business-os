export type CreateStudioModeId =
  | 'video'
  | 'image'
  | 'stories'
  | 'presentation'
  | 'document'
  | 'voice';

export type CreateStudioMode = {
  id: CreateStudioModeId;
  label: string;
  description: string;
  icon: string;
  noun: string;
};

export type CreateStudioBrief = {
  modeId: CreateStudioModeId;
  goal: string;
  audience?: string;
  format?: string;
  context?: string;
};

export const CREATE_STUDIO_MODES: CreateStudioMode[] = [
  {
    id: 'video',
    label: 'Видео',
    description: 'Концепция, сценарий, сцены, озвучка и финальная сборка',
    icon: '▶',
    noun: 'видео',
  },
  {
    id: 'image',
    label: 'Картинка',
    description: 'Рекламный креатив, баннер, визуал или иллюстрация',
    icon: '◇',
    noun: 'картинку',
  },
  {
    id: 'stories',
    label: 'Сторис',
    description: 'Серия сторис с хуком, логикой и призывом к действию',
    icon: '▤',
    noun: 'серию сторис',
  },
  {
    id: 'presentation',
    label: 'Презентация',
    description: 'Структура, слайды, тексты и визуальная логика',
    icon: '▥',
    noun: 'презентацию',
  },
  {
    id: 'document',
    label: 'Документ',
    description: 'Коммерческое предложение, инструкция, план или материал',
    icon: '▱',
    noun: 'документ',
  },
  {
    id: 'voice',
    label: 'Озвучка',
    description: 'Текст, интонация и подготовка голоса под задачу',
    icon: '◉',
    noun: 'озвучку',
  },
];

export function getCreateStudioMode(modeId: CreateStudioModeId): CreateStudioMode {
  return CREATE_STUDIO_MODES.find((item) => item.id === modeId) ?? CREATE_STUDIO_MODES[0]!;
}

export function buildCreateStudioPrompt(input: CreateStudioBrief): string {
  const mode = getCreateStudioMode(input.modeId);
  const lines = [
    `Создай ${mode.noun} под мою задачу.`,
    `Цель: ${input.goal.trim()}`,
  ];

  if (input.audience?.trim()) lines.push(`Аудитория: ${input.audience.trim()}`);
  if (input.format?.trim()) lines.push(`Формат: ${input.format.trim()}`);
  if (input.context?.trim()) lines.push(`Контекст: ${input.context.trim()}`);

  lines.push(
    '',
    'Сначала предложи концепцию и структуру результата.',
    'Покажи план до затратных действий и не запускай финальную генерацию без моего подтверждения.',
  );

  return lines.join('\n');
}
