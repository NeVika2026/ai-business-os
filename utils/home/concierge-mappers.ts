import type { OrchestratorRun } from '@/types/orchestrator';
import { mapRunsToUsageStats, type CabinetRawSnapshot } from '@/utils/cabinet/dashboard-mappers';
import type { HomeGoalId, HomeUserContext, HomeData } from '@/utils/home/home-types';
import { buildHomeFromSnapshot, createEmptyHome } from '@/utils/home/home-mappers';

export type ConciergeGreeting = {
  salutation: string;
  userName: string;
  organization: string;
  currentFocus: string;
  currentProject: string | null;
  currentExecution: string | null;
};

export type ConversationChip = {
  id: string;
  label: string;
  icon: string;
  goalId: HomeGoalId;
};

export type SuggestedJourney = {
  id: string;
  title: string;
  description: string;
  href: string;
  goalId: HomeGoalId | null;
  kind: 'continue' | 'resume' | 'strategy' | 'review' | 'plan';
};

export type PersonalInsight = {
  id: string;
  message: string;
  tone: 'positive' | 'neutral' | 'warning';
};

export type DailyMission = {
  title: string;
  description: string;
  href: string;
  goalId: HomeGoalId | null;
};

export type ContinueJourney = {
  title: string;
  description: string;
  resumeHref: string;
  resumeLabel: string;
  runningExecutionLabel: string | null;
  projectName: string | null;
};

export type ConciergeData = {
  greeting: ConciergeGreeting;
  conversationChips: ConversationChip[];
  suggestedJourneys: SuggestedJourney[];
  insights: PersonalInsight[];
  dailyMission: DailyMission;
  continueJourney: ContinueJourney;
};

export const CONVERSATION_CHIPS: ConversationChip[] = [
  { id: 'revenue', label: 'Revenue', icon: '📈', goalId: 'increase_revenue' },
  { id: 'clients', label: 'Clients', icon: '🎯', goalId: 'find_clients' },
  { id: 'automation', label: 'Automation', icon: '⚙️', goalId: 'automate_routine' },
  { id: 'marketing', label: 'Marketing', icon: '📣', goalId: 'create_content' },
  { id: 'content', label: 'Content', icon: '✍️', goalId: 'create_content' },
  { id: 'ai', label: 'AI', icon: '🧠', goalId: 'understand_ai' },
  { id: 'projects', label: 'Projects', icon: '🚀', goalId: 'launch_project' },
  { id: 'organization', label: 'Organization', icon: '🗂️', goalId: 'organize_business' },
  { id: 'not_sure', label: 'Not sure', icon: '🧭', goalId: 'dont_know' },
];

export function resolveConciergeSalutation(now: Date = new Date()): string {
  const hour = now.getHours();

  if (hour < 12) {
    return 'Good morning';
  }

  if (hour < 17) {
    return 'Good afternoon';
  }

  return 'Good evening';
}

function isMarketingRun(run: OrchestratorRun): boolean {
  const prompt = run.input.user_prompt;

  if (typeof prompt === 'string' && /marketing|campaign|content/i.test(prompt)) {
    return true;
  }

  const action = run.input.action;

  return typeof action === 'string' && /marketing|campaign|content/i.test(action);
}

function isAutomationRun(run: OrchestratorRun): boolean {
  const prompt = run.input.user_prompt;

  if (typeof prompt === 'string' && /automat|workflow|routine/i.test(prompt)) {
    return true;
  }

  const action = run.input.action;

  return typeof action === 'string' && /automat|workflow|routine/i.test(action);
}

function runDurationHours(run: OrchestratorRun): number {
  if (!run.started_at || !run.completed_at) {
    return 0;
  }

  const durationMs = new Date(run.completed_at).getTime() - new Date(run.started_at).getTime();

  return durationMs > 0 ? durationMs / (1000 * 60 * 60) : 0;
}

export function mapConciergeGreeting(home: HomeData, now: Date = new Date()): ConciergeGreeting {
  const continueWorking = home.continueWorking;
  const latestProject = home.recentProjects[0] ?? null;
  const runningExecution = continueWorking.runningExecution;

  let currentFocus = 'Start a conversation with OSA to define your next outcome.';

  if (runningExecution) {
    currentFocus = `Resume ${runningExecution.label}`;
  } else if (latestProject) {
    currentFocus = `Continue ${latestProject.name}`;
  } else if (home.dailySummary.todayExecutions > 0) {
    currentFocus = 'Review today’s AI activity and pick the next move.';
  }

  return {
    salutation: resolveConciergeSalutation(now),
    userName: home.welcome.userName,
    organization: home.welcome.organization,
    currentFocus,
    currentProject: latestProject?.name ?? continueWorking.lastProject?.name ?? null,
    currentExecution: runningExecution?.label ?? null,
  };
}

export function mapSuggestedJourneys(home: HomeData): SuggestedJourney[] {
  const journeys: SuggestedJourney[] = [];
  const latestProject = home.recentProjects[0] ?? null;
  const runningExecution = home.continueWorking.runningExecution;

  if (latestProject) {
    journeys.push({
      id: 'continue-project',
      title: 'Continue project',
      description: `Pick up ${latestProject.name} where you left off.`,
      href: latestProject.href,
      goalId: null,
      kind: 'continue',
    });
  }

  if (runningExecution) {
    journeys.push({
      id: 'resume-execution',
      title: 'Resume execution',
      description: runningExecution.label,
      href: runningExecution.href,
      goalId: null,
      kind: 'resume',
    });
  }

  journeys.push({
    id: 'generate-strategy',
    title: 'Generate new strategy',
    description: 'Ask OSA to propose the next strategic move.',
    href: '/osa',
    goalId: 'dont_know',
    kind: 'strategy',
  });

  journeys.push({
    id: 'review-yesterday',
    title: 'Review yesterday',
    description: 'See what ran recently and what needs attention.',
    href: '/history',
    goalId: null,
    kind: 'review',
  });

  journeys.push({
    id: 'marketing-plan',
    title: 'Create marketing plan',
    description: 'Launch a guided marketing workflow with OSA.',
    href: '/osa',
    goalId: 'create_content',
    kind: 'plan',
  });

  return journeys.slice(0, 5);
}

export function mapPersonalInsights(snapshot: CabinetRawSnapshot): PersonalInsight[] {
  const usage = mapRunsToUsageStats(snapshot.runs);
  const insights: PersonalInsight[] = [];

  if (usage.weekRuns > 0) {
    insights.push({
      id: 'week-runs',
      message: `You launched ${usage.weekRuns} AI run${usage.weekRuns === 1 ? '' : 's'} this week.`,
      tone: 'positive',
    });
  }

  const marketingRuns = snapshot.runs.filter(isMarketingRun);
  const completedMarketing = marketingRuns.filter((run) => run.status === 'completed');

  if (marketingRuns.length > 0) {
    const successRate = Math.round((completedMarketing.length / marketingRuns.length) * 100);

    insights.push({
      id: 'marketing-success',
      message: `Marketing tasks succeed ${successRate}%.`,
      tone: successRate >= 70 ? 'positive' : 'neutral',
    });
  }

  const automationRuns = snapshot.runs.filter(isAutomationRun);
  const savedHours = Math.round(
    automationRuns.reduce((total, run) => total + runDurationHours(run), 0),
  );

  if (savedHours > 0) {
    insights.push({
      id: 'automation-saved',
      message: `Automation saves ${savedHours} hour${savedHours === 1 ? '' : 's'}.`,
      tone: 'positive',
    });
  }

  const recentKnowledgeActivity = snapshot.events.some(
    (event) =>
      event.source === 'knowledge' ||
      event.type.includes('knowledge') ||
      event.type.includes('document'),
  );

  if (snapshot.knowledgeSourceCount > 0 && !recentKnowledgeActivity) {
    insights.push({
      id: 'knowledge-unused',
      message: 'Knowledge base not used recently.',
      tone: 'warning',
    });
  }

  if (insights.length === 0) {
    insights.push({
      id: 'getting-started',
      message: 'Start a conversation with OSA to unlock personalized insights.',
      tone: 'neutral',
    });
  }

  return insights.slice(0, 4);
}

export function mapDailyMission(home: HomeData, snapshot: CabinetRawSnapshot): DailyMission {
  const runningExecution = home.continueWorking.runningExecution;
  const marketingProject = home.recentProjects.find((project) => project.type === 'marketing');
  const failedRun = snapshot.runs.find((run) => run.status === 'failed');

  if (runningExecution) {
    return {
      title: 'Complete your active workflow',
      description: runningExecution.label,
      href: runningExecution.href,
      goalId: null,
    };
  }

  if (failedRun) {
    return {
      title: 'Review a failed execution',
      description: 'Resolve the latest failed run before starting something new.',
      href: `/orchestrator/runs/${failedRun.id}`,
      goalId: null,
    };
  }

  if (marketingProject) {
    return {
      title: 'Complete your marketing workflow',
      description: `Advance ${marketingProject.name} with OSA today.`,
      href: marketingProject.href,
      goalId: 'create_content',
    };
  }

  if (home.recentProjects.length === 0) {
    return {
      title: 'Launch your first project',
      description: 'Create a project so OSA can organize work around an outcome.',
      href: '/projects',
      goalId: 'launch_project',
    };
  }

  return {
    title: 'Define today’s priority with OSA',
    description: 'Tell OSA what you want to improve and it will prepare the workspace.',
    href: '/osa',
    goalId: 'dont_know',
  };
}

export function mapContinueJourney(home: HomeData): ContinueJourney {
  const { continueWorking } = home;

  if (continueWorking.runningExecution) {
    return {
      title: 'Resume unfinished execution',
      description: continueWorking.runningExecution.label,
      resumeHref: continueWorking.resumeHref ?? continueWorking.runningExecution.href,
      resumeLabel: continueWorking.resumeLabel,
      runningExecutionLabel: continueWorking.runningExecution.label,
      projectName: continueWorking.lastProject?.name ?? null,
    };
  }

  if (continueWorking.lastProject) {
    return {
      title: 'Continue your last project',
      description: continueWorking.lastProject.name,
      resumeHref: continueWorking.resumeHref ?? continueWorking.lastProject.href,
      resumeLabel: continueWorking.resumeLabel,
      runningExecutionLabel: null,
      projectName: continueWorking.lastProject.name,
    };
  }

  return {
    title: 'Start your first journey',
    description: 'OSA will guide you from a blank slate.',
    resumeHref: continueWorking.resumeHref ?? '/osa',
    resumeLabel: continueWorking.resumeLabel,
    runningExecutionLabel: null,
    projectName: null,
  };
}

export function getConversationChipGoalId(chipId: string): HomeGoalId | null {
  return CONVERSATION_CHIPS.find((chip) => chip.id === chipId)?.goalId ?? null;
}

export function getJourneyGoalId(
  journeyId: string,
  journeys: SuggestedJourney[],
): HomeGoalId | null {
  return journeys.find((journey) => journey.id === journeyId)?.goalId ?? null;
}

export function buildConciergeFromHomeData(
  home: HomeData,
  snapshot: CabinetRawSnapshot,
  now: Date = new Date(),
): ConciergeData {
  return {
    greeting: mapConciergeGreeting(home, now),
    conversationChips: CONVERSATION_CHIPS,
    suggestedJourneys: mapSuggestedJourneys(home),
    insights: mapPersonalInsights(snapshot),
    dailyMission: mapDailyMission(home, snapshot),
    continueJourney: mapContinueJourney(home),
  };
}

export function buildConciergeFromSnapshot(
  snapshot: CabinetRawSnapshot,
  context: HomeUserContext,
  now: Date = new Date(),
): ConciergeData {
  const home = buildHomeFromSnapshot(snapshot, context);

  return buildConciergeFromHomeData(home, snapshot, now);
}

export function createEmptyConcierge(context: HomeUserContext): ConciergeData {
  const home = createEmptyHome(context);
  const emptySnapshot: CabinetRawSnapshot = {
    runs: [],
    events: [],
    organization: null,
    projects: [],
    projectCount: 0,
    workspaceCount: 0,
    agentCount: 0,
    documentCount: 0,
    knowledgeSourceCount: 0,
    crmLeadCount: 0,
    memoryCount: 0,
    health: {
      database: 'unknown',
      gateway: 'unknown',
      runtime: 'unknown',
      memory: 'unknown',
      knowledge: 'unknown',
      automation: 'unknown',
    },
    userEmail: context.email,
  };

  return buildConciergeFromHomeData(home, emptySnapshot);
}
