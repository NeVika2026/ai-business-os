import type { DeliverableType } from '@/types/deliverables';

import { assignDeliverableType } from '@/lib/deliverables/deliverable-catalog';

import { loadProjectSkillDeliverables } from './skill-storage';

export function resolveDeliverableTypeForAgent(input: {
  projectId: string;
  agentId: string;
  agentIndex: number;
  usedTypes: Set<DeliverableType>;
}): DeliverableType {
  const skillDeliverables = loadProjectSkillDeliverables(input.projectId);

  if (skillDeliverables) {
    const preferred = skillDeliverables[input.agentIndex];

    if (preferred) {
      if (!input.usedTypes.has(preferred)) {
        input.usedTypes.add(preferred);
        return preferred;
      }

      const alternate = skillDeliverables.find((type) => !input.usedTypes.has(type));

      if (alternate) {
        input.usedTypes.add(alternate);
        return alternate;
      }
    }
  }

  return assignDeliverableType(input.agentId, input.usedTypes);
}
