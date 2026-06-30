export const THINKING_MESSAGES = [
  'Анализируем задачу',
  'Собираем контекст',
  'Подбираем оптимальную стратегию',
  'Формируем первый план',
] as const;

/** Pause before the first line appears (after Orbit). */
export const THINKING_FIRST_MESSAGE_DELAY_MS = 900;

/** Pause between each subsequent line. */
export const THINKING_MESSAGE_INTERVAL_MS = 1_800;
