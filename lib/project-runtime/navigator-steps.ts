import type { NextBestStepContent } from '@/types/navigator';
import type { ProjectRuntime, ProjectRuntimeScope } from '@/types/project-runtime';

import { resolveActiveProject } from './active-project';
import { isDefaultWorkspaceId } from './constants';
import { syncProjectMemoryState } from './project-runtime-memory';

const BASE_SUBTITLE =
  'Я подготовил несколько вариантов продолжения. Выберите направление, которое сейчас важнее.';

export function buildNavigatorStepsForProject(runtime: ProjectRuntime) {
  const title = runtime.title;

  return [
    {
      id: 'quick_result' as const,
      emoji: '🚀',
      title: 'Быстро получить результат',
      description: `Сосредоточиться на действиях в «${title}», которые дадут эффект в ближайшее время.`,
      buttonLabel: 'Выбрать',
    },
    {
      id: 'build_system' as const,
      emoji: '🏗',
      title: 'Построить систему',
      description: `Разложить «${title}» на этапы и собрать понятный рабочий план.`,
      buttonLabel: 'Выбрать',
    },
    {
      id: 'scale' as const,
      emoji: '📈',
      title: 'Масштабировать',
      description: `Подготовить «${title}» к росту и автоматизации.`,
      buttonLabel: 'Выбрать',
    },
  ];
}

export function buildNextBestStepContentForProject(runtime: ProjectRuntime): NextBestStepContent {
  return {
    title: 'Следующий лучший шаг',
    subtitle: isDefaultWorkspaceId(runtime.id)
      ? BASE_SUBTITLE
      : `Для проекта «${runtime.title}». ${BASE_SUBTITLE}`,
    steps: buildNavigatorStepsForProject(runtime),
  };
}

export function resolveNextBestStepContent(
  scope: ProjectRuntimeScope,
): NextBestStepContent {
  const runtime = resolveActiveProject(scope);
  syncProjectMemoryState(runtime);
  return buildNextBestStepContentForProject(runtime);
}
