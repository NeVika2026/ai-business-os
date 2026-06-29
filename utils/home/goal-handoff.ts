import { randomUUID } from 'node:crypto';

import type { ProjectType } from '@/utils/projects/project-types';
import { getOsaTeamRecommendation } from '@/utils/osa/team-recommendation';
import type { HomeGoalId } from '@/utils/home/home-types';

export const HOME_EVENT_SOURCE = 'home';

export type HomeGoalCategory =
  | 'revenue'
  | 'growth'
  | 'launch'
  | 'content'
  | 'automation'
  | 'organization'
  | 'education'
  | 'discovery';

export type HomeGoalPriority = 'high' | 'medium' | 'low';

export type HomeGoalDefinition = {
  id: HomeGoalId;
  title: string;
  description: string;
  category: HomeGoalCategory;
  priority: HomeGoalPriority;
  recommendedTeam: string[];
  recommendedModules: string[];
  starterPrompt: string;
  suggestedProjectType: ProjectType;
  icon: string;
};

export type HomeHandoffContext = {
  projectCount: number;
  activeProjectId: string | null;
  activeProjectName: string | null;
  resumeExecutionId: string | null;
  resumeExecutionHref: string | null;
  resumeExecutionLabel: string | null;
};

export type HomeHandoffSession = {
  sessionId: string;
  goalId: HomeGoalId;
  goalTitle: string;
  starterPrompt: string;
  recommendedTeam: string[];
  recommendedTeamIds: string[];
  recommendedModules: string[];
  recommendedProjectType: ProjectType;
  source: 'home';
  createdAt: string;
  hasActiveProject: boolean;
  activeProjectId: string | null;
  activeProjectName: string | null;
  resumeExecutionId: string | null;
  resumeExecutionHref: string | null;
  resumeExecutionLabel: string | null;
};

export type HomeHandoffEventType =
  | 'home_goal_selected'
  | 'goal_handoff_started'
  | 'goal_handoff_completed';

export type HomeHandoffNavigation = {
  url: string;
  session: HomeHandoffSession;
};

export type OsaHomeHandoffInput = {
  goalId: string;
  goalTitle: string;
  starterPrompt: string;
  recommendedTeam: string[];
  recommendedTeamIds: string[];
  recommendedModules: string[];
  recommendedProjectType: ProjectType;
  source: 'home';
  sessionId: string;
  resumeRunId: string | null;
  resumeRunHref: string | null;
  resumeRunLabel: string | null;
  needsProject: boolean;
  activeProjectName: string | null;
};

export const HOME_HANDOFF_EVENT_LABELS: Record<HomeHandoffEventType, string> = {
  home_goal_selected: 'Goal selected',
  goal_handoff_started: 'OSA handoff started',
  goal_handoff_completed: 'Workspace prepared',
};

export const HOME_GOAL_DEFINITIONS: HomeGoalDefinition[] = [
  {
    id: 'increase_revenue',
    title: 'Increase Revenue',
    description: 'Grow sales, improve conversion, and unlock new revenue streams.',
    category: 'revenue',
    priority: 'high',
    recommendedTeam: ['Business Manager', 'CRM Agent', 'Marketing Agent'],
    recommendedModules: ['osa', 'crm', 'analytics', 'marketing'],
    starterPrompt:
      'Help me increase revenue for my business. Analyze my current funnel, suggest high-impact actions, and prepare an execution plan.',
    suggestedProjectType: 'finance',
    icon: '📈',
  },
  {
    id: 'find_clients',
    title: 'Find Clients',
    description: 'Build pipeline, outreach workflows, and client acquisition systems.',
    category: 'growth',
    priority: 'high',
    recommendedTeam: ['CRM Agent', 'Marketing Agent', 'Business Manager'],
    recommendedModules: ['osa', 'crm', 'marketing'],
    starterPrompt:
      'I need more clients. Help me define my ideal customer, build an outreach plan, and set up the first acquisition workflow.',
    suggestedProjectType: 'crm',
    icon: '🎯',
  },
  {
    id: 'launch_project',
    title: 'Launch Business',
    description: 'Start a new initiative with OSA, projects, and execution planning.',
    category: 'launch',
    priority: 'high',
    recommendedTeam: ['Business Manager', 'Marketing Agent', 'Analyst'],
    recommendedModules: ['osa', 'projects', 'documents', 'knowledge'],
    starterPrompt:
      'Help me launch a new business initiative. Clarify the offer, define milestones, and prepare a project workspace.',
    suggestedProjectType: 'general',
    icon: '🚀',
  },
  {
    id: 'create_content',
    title: 'Create Content',
    description: 'Draft campaigns, documents, and marketing assets with AI support.',
    category: 'content',
    priority: 'medium',
    recommendedTeam: ['Content Agent', 'Marketing Agent'],
    recommendedModules: ['osa', 'documents', 'marketing', 'knowledge'],
    starterPrompt:
      'Help me create content for my business. Suggest topics, draft the first assets, and organize them in a project.',
    suggestedProjectType: 'marketing',
    icon: '✍️',
  },
  {
    id: 'automate_routine',
    title: 'Automate Work',
    description: 'Reduce manual work with orchestrated automations and AI agents.',
    category: 'automation',
    priority: 'medium',
    recommendedTeam: ['Business Manager', 'Analyst'],
    recommendedModules: ['osa', 'automation', 'documents'],
    starterPrompt:
      'I want to automate repetitive work in my business. Identify the best candidates for automation and propose the first workflow.',
    suggestedProjectType: 'automation',
    icon: '⚙️',
  },
  {
    id: 'organize_business',
    title: 'Organize Business',
    description: 'Structure projects, knowledge, CRM, and team workflows in one place.',
    category: 'organization',
    priority: 'medium',
    recommendedTeam: ['Business Manager', 'Analyst', 'CRM Agent'],
    recommendedModules: ['osa', 'projects', 'documents', 'knowledge', 'crm'],
    starterPrompt:
      'Help me organize my business operations. Map projects, documents, and workflows into a clear structure.',
    suggestedProjectType: 'general',
    icon: '🗂️',
  },
  {
    id: 'understand_ai',
    title: 'Learn AI',
    description: 'Understand what AI can do for your organization and where to start.',
    category: 'education',
    priority: 'low',
    recommendedTeam: ['Business Manager', 'Analyst'],
    recommendedModules: ['osa', 'knowledge'],
    starterPrompt:
      'Explain how AI can help my business today. Recommend the first practical use cases and a safe starting plan.',
    suggestedProjectType: 'knowledge',
    icon: '🧠',
  },
  {
    id: 'dont_know',
    title: "Don't Know Where To Start",
    description: 'Let OSA guide you step by step from a blank slate.',
    category: 'discovery',
    priority: 'high',
    recommendedTeam: ['Business Manager'],
    recommendedModules: ['osa', 'projects'],
    starterPrompt:
      "I don't know where to start. Ask me clarifying questions, recommend the first goal, and prepare a simple workspace.",
    suggestedProjectType: 'general',
    icon: '🧭',
  },
];

export function isHomeGoalId(value: string): value is HomeGoalId {
  return HOME_GOAL_DEFINITIONS.some((goal) => goal.id === value);
}

export function getHomeGoalDefinition(goalId: HomeGoalId): HomeGoalDefinition {
  const goal = HOME_GOAL_DEFINITIONS.find((entry) => entry.id === goalId);

  if (!goal) {
    throw new Error(`Unknown home goal: ${goalId}`);
  }

  return goal;
}

export function generateStarterPrompt(goalId: HomeGoalId, context?: HomeHandoffContext): string {
  const goal = getHomeGoalDefinition(goalId);

  if (context?.activeProjectName) {
    return `${goal.starterPrompt} Current project: ${context.activeProjectName}.`;
  }

  return goal.starterPrompt;
}

export function resolveRecommendedTeam(goalId: HomeGoalId, starterPrompt: string) {
  const goal = getHomeGoalDefinition(goalId);
  const recommendation = getOsaTeamRecommendation(starterPrompt);
  const teamNames = recommendation.team.map((agent) => agent.name);
  const teamIds = recommendation.team.map((agent) => agent.id);

  return {
    recommendedTeam: teamNames.length > 0 ? teamNames : goal.recommendedTeam,
    recommendedTeamIds: teamIds,
    recommendation: recommendation.recommendation,
  };
}

export function buildHomeHandoffSession(
  goalId: HomeGoalId,
  context: HomeHandoffContext,
  sessionId: string = randomUUID(),
): HomeHandoffSession {
  const goal = getHomeGoalDefinition(goalId);
  const starterPrompt = generateStarterPrompt(goalId, context);
  const team = resolveRecommendedTeam(goalId, starterPrompt);

  return {
    sessionId,
    goalId,
    goalTitle: goal.title,
    starterPrompt,
    recommendedTeam: team.recommendedTeam,
    recommendedTeamIds: team.recommendedTeamIds,
    recommendedModules: goal.recommendedModules,
    recommendedProjectType: goal.suggestedProjectType,
    source: 'home',
    createdAt: new Date().toISOString(),
    hasActiveProject: context.projectCount > 0,
    activeProjectId: context.activeProjectId,
    activeProjectName: context.activeProjectName,
    resumeExecutionId: context.resumeExecutionId,
    resumeExecutionHref: context.resumeExecutionHref,
    resumeExecutionLabel: context.resumeExecutionLabel,
  };
}

export function buildOsaHandoffUrl(session: HomeHandoffSession): string {
  const params = new URLSearchParams({
    source: session.source,
    goalId: session.goalId,
    goalTitle: session.goalTitle,
    starterPrompt: session.starterPrompt,
    recommendedTeam: session.recommendedTeam.join('|'),
    recommendedTeamIds: session.recommendedTeamIds.join('|'),
    recommendedModules: session.recommendedModules.join('|'),
    recommendedProjectType: session.recommendedProjectType,
    sessionId: session.sessionId,
  });

  if (session.resumeExecutionId) {
    params.set('resumeRunId', session.resumeExecutionId);
  }

  if (session.resumeExecutionHref) {
    params.set('resumeRunHref', session.resumeExecutionHref);
  }

  if (session.resumeExecutionLabel) {
    params.set('resumeRunLabel', session.resumeExecutionLabel);
  }

  if (!session.hasActiveProject) {
    params.set('needsProject', '1');
  }

  if (session.activeProjectName) {
    params.set('activeProjectName', session.activeProjectName);
  }

  return `/osa?${params.toString()}`;
}

export function buildHomeHandoffNavigation(
  goalId: HomeGoalId,
  context: HomeHandoffContext,
  sessionId?: string,
): HomeHandoffNavigation {
  const session = buildHomeHandoffSession(goalId, context, sessionId);

  return {
    session,
    url: buildOsaHandoffUrl(session),
  };
}

export function buildHomeHandoffEvents(
  session: HomeHandoffSession,
  organizationId: string,
  userId: string,
) {
  const base = {
    organization_id: organizationId,
    source: HOME_EVENT_SOURCE,
    actor_type: 'user',
    actor_id: userId,
    correlation_id: session.sessionId,
  };

  return [
    {
      ...base,
      type: 'home_goal_selected' satisfies HomeHandoffEventType,
      payload: {
        goal_id: session.goalId,
        goal_title: session.goalTitle,
        category: getHomeGoalDefinition(session.goalId).category,
      },
    },
    {
      ...base,
      type: 'goal_handoff_started' satisfies HomeHandoffEventType,
      payload: {
        goal_id: session.goalId,
        starter_prompt: session.starterPrompt,
        recommended_project_type: session.recommendedProjectType,
      },
    },
    {
      ...base,
      type: 'goal_handoff_completed' satisfies HomeHandoffEventType,
      payload: {
        goal_id: session.goalId,
        recommended_team: session.recommendedTeam,
        recommended_modules: session.recommendedModules,
        resume_execution_id: session.resumeExecutionId,
        has_active_project: session.hasActiveProject,
      },
    },
  ];
}

export function parseOsaHomeHandoffInput(
  searchParams: Record<string, string | string[] | undefined>,
): OsaHomeHandoffInput | null {
  const source = readParam(searchParams.source);

  if (source !== 'home') {
    return null;
  }

  const goalId = readParam(searchParams.goalId);

  if (!goalId || !isHomeGoalId(goalId)) {
    return null;
  }

  const goalTitle = readParam(searchParams.goalTitle) ?? getHomeGoalDefinition(goalId).title;
  const starterPrompt =
    readParam(searchParams.starterPrompt) ?? getHomeGoalDefinition(goalId).starterPrompt;
  const recommendedTeam = splitParam(readParam(searchParams.recommendedTeam));
  const recommendedTeamIds = splitParam(readParam(searchParams.recommendedTeamIds));
  const recommendedModules = splitParam(readParam(searchParams.recommendedModules));
  const recommendedProjectType =
    (readParam(searchParams.recommendedProjectType) as ProjectType | null) ??
    getHomeGoalDefinition(goalId).suggestedProjectType;
  const sessionId = readParam(searchParams.sessionId) ?? randomUUID();

  return {
    goalId,
    goalTitle,
    starterPrompt,
    recommendedTeam,
    recommendedTeamIds,
    recommendedModules,
    recommendedProjectType,
    source: 'home',
    sessionId,
    resumeRunId: readParam(searchParams.resumeRunId),
    resumeRunHref: readParam(searchParams.resumeRunHref),
    resumeRunLabel: readParam(searchParams.resumeRunLabel),
    needsProject: readParam(searchParams.needsProject) === '1',
    activeProjectName: readParam(searchParams.activeProjectName),
  };
}

export function mapHandoffContextFromSnapshot(input: {
  projectCount: number;
  latestProject: { id: string; name: string } | null;
  runningExecution: { id: string; label: string; href: string } | null;
}): HomeHandoffContext {
  return {
    projectCount: input.projectCount,
    activeProjectId: input.latestProject?.id ?? null,
    activeProjectName: input.latestProject?.name ?? null,
    resumeExecutionId: input.runningExecution?.id ?? null,
    resumeExecutionHref: input.runningExecution?.href ?? null,
    resumeExecutionLabel: input.runningExecution?.label ?? null,
  };
}

export function resolveContinueWorkingMode(context: HomeHandoffContext): {
  resumeHref: string;
  resumeLabel: string;
  preferResume: boolean;
} {
  if (context.resumeExecutionHref) {
    return {
      resumeHref: context.resumeExecutionHref,
      resumeLabel: 'Resume execution',
      preferResume: true,
    };
  }

  if (context.activeProjectId) {
    return {
      resumeHref: `/projects/${context.activeProjectId}`,
      resumeLabel: 'Open last project',
      preferResume: false,
    };
  }

  return {
    resumeHref: '/osa',
    resumeLabel: 'Start with OSA',
    preferResume: false,
  };
}

export function getHomeHandoffEventLabel(type: string): string | null {
  if (type in HOME_HANDOFF_EVENT_LABELS) {
    return HOME_HANDOFF_EVENT_LABELS[type as HomeHandoffEventType];
  }

  return null;
}

function readParam(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return typeof value === 'string' && value.length > 0 ? value : null;
}

function splitParam(value: string | null): string[] {
  if (!value) {
    return [];
  }

  return value
    .split('|')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function serializeHomeSessionForSettings(session: HomeHandoffSession) {
  return session;
}

export type StoredHomeSessions = Record<string, HomeHandoffSession>;

export function readStoredHomeSession(
  settings: Record<string, unknown> | null | undefined,
  userId: string,
): HomeHandoffSession | null {
  const sessions = settings?.home_sessions;

  if (!sessions || typeof sessions !== 'object') {
    return null;
  }

  const session = (sessions as StoredHomeSessions)[userId];

  return session ?? null;
}

export function writeStoredHomeSession(
  settings: Record<string, unknown> | null | undefined,
  userId: string,
  session: HomeHandoffSession,
): Record<string, unknown> {
  const nextSettings = { ...(settings ?? {}) };
  const sessions =
    nextSettings.home_sessions && typeof nextSettings.home_sessions === 'object'
      ? { ...(nextSettings.home_sessions as StoredHomeSessions) }
      : {};

  sessions[userId] = session;
  nextSettings.home_sessions = sessions;
  nextSettings.last_home_goal_id = session.goalId;

  return nextSettings;
}
