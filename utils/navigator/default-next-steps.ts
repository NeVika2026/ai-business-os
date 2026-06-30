import type { NextBestStepContent } from '@/types/navigator';

export const NEXT_BEST_STEP_TITLE = 'Следующий лучший шаг';

export const NEXT_BEST_STEP_SUBTITLE =
  'Я подготовил несколько вариантов продолжения. Выберите направление, которое сейчас важнее.';

export const DEFAULT_NEXT_BEST_STEP: NextBestStepContent = {
  title: NEXT_BEST_STEP_TITLE,
  subtitle: NEXT_BEST_STEP_SUBTITLE,
  steps: [
    {
      id: 'quick_result',
      emoji: '🚀',
      title: 'Быстро получить результат',
      description: 'Сосредоточиться на действиях, которые дадут эффект в ближайшее время.',
      buttonLabel: 'Выбрать',
    },
    {
      id: 'build_system',
      emoji: '🏗',
      title: 'Построить систему',
      description: 'Разложить процесс на этапы и создать понятный рабочий план.',
      buttonLabel: 'Выбрать',
    },
    {
      id: 'scale',
      emoji: '📈',
      title: 'Масштабировать',
      description: 'Подготовить процесс к росту и автоматизации.',
      buttonLabel: 'Выбрать',
    },
  ],
};
