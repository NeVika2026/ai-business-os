export const LIVE_THINKING_HEADLINE = 'Думаю...' as const;

export const LIVE_THINKING_STEPS = [
  'Понимаю задачу',
  'Изучаю контекст',
  'Ищу похожие решения',
  'Проверяю слабые места',
  'Собираю план',
  'Формирую рекомендации',
] as const;

export const LIVE_THINKING_ALMOST = 'Почти готово...' as const;

export const LIVE_THINKING_FOUND = 'Кажется, нашла.' as const;

/** Delay before the first thought appears. */
export const LIVE_THINKING_START_MS = 380;

/** Interval between successive thoughts — total sequence ~2.5–3.5s. */
export const LIVE_THINKING_STEP_MS = 520;

/** Pause after the eyes look straight, before revealing the result. */
export const LIVE_THINKING_DISCOVERY_PAUSE_MS = 1_100;

export type LiveThinkingStatus =
  | { kind: 'step'; label: string; done: boolean }
  | { kind: 'almost' };

export function buildLiveThinkingStatuses(
  visibleCount: number,
  gatewayDone: boolean,
): LiveThinkingStatus[] {
  const statuses: LiveThinkingStatus[] = [];

  for (let index = 0; index < LIVE_THINKING_STEPS.length; index += 1) {
    if (index >= visibleCount) {
      break;
    }

    const isCurrent = index === visibleCount - 1 && visibleCount < LIVE_THINKING_STEPS.length;
    const label = LIVE_THINKING_STEPS[index];

    if (!label) {
      continue;
    }

    statuses.push({
      kind: 'step',
      label,
      done: !isCurrent || visibleCount >= LIVE_THINKING_STEPS.length,
    });
  }

  if (visibleCount >= LIVE_THINKING_STEPS.length && !gatewayDone) {
    statuses.push({ kind: 'almost' });
  }

  return statuses;
}

export function isLiveThinkingSequenceComplete(visibleCount: number): boolean {
  return visibleCount >= LIVE_THINKING_STEPS.length;
}

export function canRevealDiscovery(visibleCount: number, gatewayDone: boolean): boolean {
  return isLiveThinkingSequenceComplete(visibleCount) && gatewayDone;
}
