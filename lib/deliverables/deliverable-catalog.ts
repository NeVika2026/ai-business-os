import type { DeliverableType } from '@/types/deliverables';
import type { OsaAgentId } from '@/utils/osa/agent-registry';

export const DELIVERABLE_TYPE_LABELS: Record<DeliverableType, string> = {
  landing: 'Landing',
  presentation: 'Presentation',
  marketing_plan: 'Marketing Plan',
  content_plan: 'Content Plan',
  sales_script: 'Sales Script',
  business_strategy: 'Business Strategy',
};

const AGENT_DELIVERABLE_PREFERENCES: Record<OsaAgentId, DeliverableType[]> = {
  'business-manager': ['business_strategy'],
  marketing: ['marketing_plan', 'landing'],
  content: ['content_plan', 'landing'],
  sales: ['sales_script'],
  crm: ['sales_script', 'marketing_plan'],
  analyst: ['business_strategy', 'marketing_plan'],
  'project-manager': ['presentation'],
  'knowledge-manager': ['content_plan'],
  finance: ['business_strategy'],
  lawyer: ['presentation'],
  support: ['sales_script'],
  hr: ['content_plan'],
  estate: ['presentation', 'sales_script'],
  mlm: ['content_plan', 'marketing_plan'],
};

export const DELIVERABLE_TYPE_ORDER: DeliverableType[] = [
  'business_strategy',
  'marketing_plan',
  'content_plan',
  'landing',
  'presentation',
  'sales_script',
];

export function assignDeliverableType(
  agentId: string,
  usedTypes: Set<DeliverableType>,
): DeliverableType {
  const preferences =
    AGENT_DELIVERABLE_PREFERENCES[agentId as OsaAgentId] ??
    (['business_strategy'] as DeliverableType[]);

  for (const type of preferences) {
    if (!usedTypes.has(type)) {
      usedTypes.add(type);
      return type;
    }
  }

  for (const type of DELIVERABLE_TYPE_ORDER) {
    if (!usedTypes.has(type)) {
      usedTypes.add(type);
      return type;
    }
  }

  return 'business_strategy';
}

export function deliverablePhaseLabel(phase: 'thinking' | 'draft' | 'ready'): string {
  switch (phase) {
    case 'thinking':
      return 'Thinking…';
    case 'draft':
      return 'Draft…';
    case 'ready':
      return 'Ready';
  }
}
