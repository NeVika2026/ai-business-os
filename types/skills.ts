import type { DeliverableType } from '@/types/deliverables';
import type { RealWorkTaskType } from '@/utils/home/real-work-mode';
import type { OsaAgentId } from '@/utils/osa/agent-registry';
import type { ProjectType } from '@/utils/projects/project-types';

export const OSA_SKILL_IDS = [
  'estate-analysis',
  'presentation-create',
  'landing-create',
  'marketing-campaign',
  'content-plan',
  'sales-playbook',
  'business-strategy',
  'market-analysis',
] as const;

export type OsaSkillId = (typeof OSA_SKILL_IDS)[number];

export type OsaSkill = {
  id: OsaSkillId;
  name: string;
  description: string;
  signals: string[];
  team: OsaAgentId[];
  deliverables: DeliverableType[];
  primaryDeliverable: DeliverableType;
  projectType: ProjectType;
  taskType: RealWorkTaskType;
};

export type ProjectSkillSelection = {
  projectId: string;
  skillId: OsaSkillId;
  skillName: string;
  selectedAt: string;
};
