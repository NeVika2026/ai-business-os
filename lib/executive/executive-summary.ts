import type { ExecutiveDecision } from '@/types/executive';

import { goalLabel } from './executive-goals';

export function buildExecutiveSummary(decision: Pick<ExecutiveDecision, 'goal' | 'workingMode' | 'projectDecision' | 'memoryMode'>): string {
  const goal = goalLabel(decision.goal);
  const mode =
    decision.workingMode === 'continuation' ? 'продолжение работы' : 'новая задача';

  const project =
    decision.projectDecision === 'continue_active'
      ? 'активный проект'
      : decision.projectDecision === 'create_new'
        ? 'новый проект'
        : 'Default Workspace';

  const memory =
    decision.memoryMode === 'none'
      ? 'без памяти'
      : decision.memoryMode === 'project'
        ? 'память проекта'
        : decision.memoryMode === 'recent'
          ? 'недавняя память'
          : 'память организации';

  return `${goal} · ${mode} · ${project} · ${memory}`;
}
