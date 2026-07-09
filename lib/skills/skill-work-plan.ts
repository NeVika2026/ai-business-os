import type { OsaSkill } from '@/types/skills';
import { getOsaAgentById } from '@/utils/osa/agent-registry';

import type { ProjectLifecyclePlanStep } from '@/lib/project-lifecycle/build-work-plan';

const PRIORITY_LABEL = {
  high: 'Высокий приоритет',
  medium: 'Средний приоритет',
  low: 'Низкий приоритет',
} as const;

export function buildWorkPlanFromSkill(skill: OsaSkill, projectName: string): ProjectLifecyclePlanStep[] {
  const priorities: Array<'high' | 'medium' | 'low'> = ['high', 'medium', 'low'];

  return skill.team.map((agentId, index) => {
    const agent = getOsaAgentById(agentId);
    const priority = priorities[index] ?? 'low';

    return {
      title: `${agent?.title ?? agentId}: ${skill.name} для «${projectName}»`,
      estimate: index === 0 ? '≈ 2 часа' : index === 1 ? '≈ 45 минут' : '≈ 30 минут',
      priority,
      priorityLabel: PRIORITY_LABEL[priority],
    };
  });
}
