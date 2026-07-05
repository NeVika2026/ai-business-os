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

export type ExecutiveReviewConfidence = 'low' | 'medium' | 'high';

export type ExecutiveReview = {
  score: number;
  confidence: ExecutiveReviewConfidence;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  nextAction: string;
  reviewedAt: string;
};

export type DeliverableVersionLabel = 'draft' | 'improved' | 'final';

export type DeliverableVersion = {
  version: number;
  label: DeliverableVersionLabel;
  labelDisplay: string;
  content: string;
  summary: string;
  changeNotes: string[];
  createdAt: string;
};

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
  review: ExecutiveReview | null;
  versions: DeliverableVersion[];
  currentVersion: number;
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

export const DELIVERABLE_VERSION_LABELS: Record<DeliverableVersionLabel, string> = {
  draft: 'Draft',
  improved: 'Improved by Executive Brain',
  final: 'Final',
};
