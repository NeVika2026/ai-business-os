export const DELIVERABLE_TYPES = [
  'landing',
  'presentation',
  'marketing_plan',
  'content_plan',
  'sales_script',
  'business_strategy',
] as const;

export type DeliverableType = (typeof DELIVERABLE_TYPES)[number];

export type DeliverablePhase = 'thinking' | 'draft' | 'ready';

export type ProjectDeliverable = {
  id: string;
  type: DeliverableType;
  title: string;
  agentId: string;
  agentRole: string;
  taskTitle: string;
  phase: DeliverablePhase;
  summary: string;
  content: string;
  updatedAt: string;
};

export type ProjectDeliverablesPackage = {
  projectId: string;
  projectName: string;
  deliverables: ProjectDeliverable[];
  packageStatus: 'in_progress' | 'ready';
  executiveSummary: string | null;
  assembledAt: string | null;
  updatedAt: string;
};
