import type { ExecutiveAttentionItem } from '@/types/executive-attention';

export type MissionControlProject = {
  id: string;
  name: string;
  href: string;
  status: string;
};

export type MissionControlOrchestraAgent = {
  name: string;
  role: string;
  status: string;
  progressPercent: number;
  activity: string;
};

export type MissionControlDeliverable = {
  title: string;
  phaseLabel: string;
};

export type MissionControlData = {
  organizationName: string;
  userName: string;
  todayFocus: {
    headline: string;
    context: string;
  };
  nextBestAction: {
    label: string;
    href: string;
    description: string;
  };
  activeProjects: MissionControlProject[];
  orchestra: {
    projectName: string;
    projectHref: string;
    overallProgress: number;
    activeActivity: string | null;
    agents: MissionControlOrchestraAgent[];
  } | null;
  deliverables: {
    projectName: string;
    projectHref: string;
    readyCount: number;
    executiveSummary: string | null;
    items: MissionControlDeliverable[];
  } | null;
  recommendations: string[];
  risks: string[];
  attentionRequired: ExecutiveAttentionItem[];
  continueHref: string;
  continueLabel: string;
};
