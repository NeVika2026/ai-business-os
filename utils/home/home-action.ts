export const HOME_ACTION_PLACEHOLDER = 'Что нужно разобрать, создать или улучшить?' as const;

export const HOME_PROCESS_STEPS = [
  'OSA читает задачу',
  'OSA ищет контекст',
  'OSA определяет проблему',
  'OSA предлагает первый результат',
] as const;

export const HOME_QUICK_ACTIONS = [
  {
    id: 'analysis',
    label: 'Создать анализ',
    template: 'Создай анализ',
  },
  {
    id: 'debug',
    label: 'Найти ошибку',
    template: 'Найди ошибку',
  },
  {
    id: 'plan',
    label: 'Собрать план',
    template: 'Собери план',
  },
] as const;

export type HomeQuickActionId = (typeof HOME_QUICK_ACTIONS)[number]['id'];

export function buildHomeTaskPrompt(input: string, quickActionId?: HomeQuickActionId): string {
  const trimmed = input.trim();
  const action = HOME_QUICK_ACTIONS.find((entry) => entry.id === quickActionId);

  if (!action) {
    return trimmed;
  }

  if (!trimmed) {
    return action.template;
  }

  return `${action.template}: ${trimmed}`;
}

export function homeTaskErrorHint(message: string): string {
  const normalized = message.toLowerCase();

  if (normalized.includes('авторизац') || normalized.includes('unauthorized')) {
    return 'Войдите снова и повторите запрос.';
  }

  if (normalized.includes('gateway') || normalized.includes('ai') || normalized.includes('связаться')) {
    return 'Проверьте соединение и нажмите «Попробовать снова».';
  }

  if (normalized.includes('runtime') || normalized.includes('недоступен')) {
    return 'Обновите страницу или откройте проект в Workspace.';
  }

  return 'Упростите формулировку или выберите одно из быстрых действий.';
}
