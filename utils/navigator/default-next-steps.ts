import type { NextBestStepContent, NavigatorStepId } from '@/types/navigator';
import type { ProjectRuntimeScope } from '@/types/project-runtime';
import { getLastExecutiveDecision } from '@/lib/executive/executive-engine';
import { loadNavigatorState } from '@/lib/storage/navigator-storage';
import { getRuntimeStorage } from '@/lib/storage/storage-factory';
import { resolveNextBestStepContent } from '@/lib/project-runtime/navigator-steps';

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

function prioritizeNavigatorStep(
  content: NextBestStepContent,
  stepId: NavigatorStepId,
): NextBestStepContent {
  const preferred = content.steps.find((step) => step.id === stepId);

  if (!preferred) {
    return content;
  }

  return {
    ...content,
    steps: [preferred, ...content.steps.filter((step) => step.id !== stepId)],
  };
}

export function getNextBestStepContent(scope?: ProjectRuntimeScope): NextBestStepContent {
  if (!scope?.organizationId) {
    return DEFAULT_NEXT_BEST_STEP;
  }

  const decision = getLastExecutiveDecision(scope);
  const navigatorState = loadNavigatorState(
    getRuntimeStorage(),
    scope.organizationId,
    scope.userId,
  );
  const navigatorMode = decision?.navigatorMode ?? navigatorState?.navigatorMode ?? null;

  if (navigatorMode === 'none') {
    return DEFAULT_NEXT_BEST_STEP;
  }

  const content = resolveNextBestStepContent(scope);

  if (navigatorMode === 'scale') {
    return prioritizeNavigatorStep(content, 'scale');
  }

  if (navigatorMode === 'new_project') {
    return prioritizeNavigatorStep(content, 'build_system');
  }

  if (navigatorState?.lastSuggestedStepId) {
    return prioritizeNavigatorStep(content, navigatorState.lastSuggestedStepId);
  }

  return content;
}
