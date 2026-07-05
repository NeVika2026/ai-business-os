import type { OsaAgentId } from '@/utils/osa/agent-registry';
import { getOsaAgentById } from '@/utils/osa/agent-registry';
import type { ProjectType } from '@/utils/projects/project-types';

export type ProjectLifecycleSpecialist = {
  id: OsaAgentId;
  role: string;
  status: string;
};

const SPECIALISTS_BY_TYPE: Record<ProjectType, OsaAgentId[]> = {
  general: ['business-manager', 'project-manager', 'analyst'],
  marketing: ['business-manager', 'marketing', 'content'],
  crm: ['business-manager', 'crm', 'sales'],
  automation: ['business-manager', 'project-manager', 'analyst'],
  knowledge: ['business-manager', 'knowledge-manager', 'content'],
  finance: ['business-manager', 'finance', 'analyst'],
  estate: ['business-manager', 'estate', 'sales'],
  mlm: ['business-manager', 'mlm', 'content'],
};

export function selectProjectSpecialists(type: ProjectType): ProjectLifecycleSpecialist[] {
  const ids = SPECIALISTS_BY_TYPE[type] ?? SPECIALISTS_BY_TYPE.general;

  return ids.map((id) => {
    const agent = getOsaAgentById(id);

    return {
      id,
      role: agent?.title ?? id,
      status: agent?.defaultStatus ?? 'На связи',
    };
  });
}
