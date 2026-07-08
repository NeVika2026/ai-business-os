import { OSA_PROCESS_STEPS, OSA_VOICE } from '@/utils/first-experience/osa-voice';

export const HOME_ACTION_PLACEHOLDER = OSA_VOICE.home.placeholder;

export const HOME_PROCESS_STEPS = OSA_PROCESS_STEPS;

export const HOME_QUICK_ACTIONS = [
  {
    id: 'analysis',
    label: 'Разобраться',
    template: 'Помоги разобраться',
  },
  {
    id: 'debug',
    label: 'Найти слабое место',
    template: 'Найди слабое место',
  },
  {
    id: 'plan',
    label: 'Наметить план',
    template: 'Наметь план',
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
    return 'Обновите страницу или вернитесь к задаче чуть позже.';
  }

  return 'Попробуйте короче сформулировать или выберите один из вариантов ниже.';
}
