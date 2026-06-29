export const HOME_GOAL_IDS = [
  'increase_revenue',
  'find_clients',
  'launch_project',
  'create_content',
  'automate_routine',
  'organize_business',
  'understand_ai',
  'dont_know',
] as const;

export type HomeGoalId = (typeof HOME_GOAL_IDS)[number];

export const HOME_GOAL_STORAGE_KEY = 'ai-business-os-home-goal';

export type HomeWelcome = {
  userName: string;
  organization: string;
  workspace: string;
};

export type HomeGoal = {
  id: HomeGoalId;
  label: string;
  description: string;
  icon: string;
};

export type HomeProjectItem = {
  id: string;
  name: string;
  href: string;
  updatedAt: string;
  type: string;
};

export type HomeExecutionItem = {
  id: string;
  label: string;
  status: string;
  duration: string;
  timestamp: string;
  href: string;
};

export type ContinueWorkingData = {
  runningExecution: HomeExecutionItem | null;
  lastProject: HomeProjectItem | null;
  resumeHref: string | null;
  resumeLabel: string;
};

export type SmartSuggestion = {
  id: string;
  title: string;
  description: string;
  href: string;
  reason: string;
};

export type PinnedAction = {
  id: string;
  label: string;
  href: string;
  icon: string;
};

export type DailySummaryData = {
  todayExecutions: number;
  completed: number;
  failed: number;
  runtimeLabel: string;
  aiUsageLabel: string;
};

export type HomeData = {
  welcome: HomeWelcome;
  goals: HomeGoal[];
  continueWorking: ContinueWorkingData;
  suggestions: SmartSuggestion[];
  pinnedActions: PinnedAction[];
  dailySummary: DailySummaryData;
  recentProjects: HomeProjectItem[];
  recentExecutions: HomeExecutionItem[];
  askOsaPlaceholders: string[];
};

export type HomeUserContext = {
  email: string;
  organizationName: string;
  userName: string | null;
};
