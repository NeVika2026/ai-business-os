import type { OsaSkill } from '@/types/skills';
import { getOsaAgentById } from '@/utils/osa/agent-registry';

import type { ProjectLifecycleSpecialist } from '@/lib/project-lifecycle/select-specialists';

export function specialistsFromSkill(skill: OsaSkill): ProjectLifecycleSpecialist[] {
  return skill.team.map((id) => {
    const agent = getOsaAgentById(id);

    return {
      id,
      role: agent?.title ?? id,
      status: agent?.defaultStatus ?? 'На связи',
    };
  });
}
