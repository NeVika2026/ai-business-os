export type OrchestraAgentStatus = 'waiting' | 'working' | 'blocked' | 'completed';

export type OrchestraAgent = {
  id: string;
  agentId: string;
  name: string;
  role: string;
  taskTitle: string;
  currentActivity: string;
  status: OrchestraAgentStatus;
  progressPercent: number;
  blockedReason: string | null;
};

export type AiOrchestraState = {
  projectId: string;
  projectName: string;
  executionMode: 'sequential' | 'hybrid' | 'parallel';
  queue: OrchestraAgent[];
  activeAgentId: string | null;
  reviewRequired: boolean;
  overallProgress: number;
  updatedAt: string;
};
