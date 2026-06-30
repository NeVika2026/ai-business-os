export const EXECUTIVE_GOALS = [
  'find_clients',
  'create_content',
  'business_analysis',
  'design',
  'learning',
  'other',
] as const;

export type ExecutiveGoal = (typeof EXECUTIVE_GOALS)[number];

export const EXECUTIVE_WORKING_MODES = ['continuation', 'new_task'] as const;

export type ExecutiveWorkingMode = (typeof EXECUTIVE_WORKING_MODES)[number];

export const EXECUTIVE_PROJECT_DECISIONS = [
  'continue_active',
  'create_new',
  'default_workspace',
] as const;

export type ExecutiveProjectDecision = (typeof EXECUTIVE_PROJECT_DECISIONS)[number];

export const EXECUTIVE_MEMORY_MODES = ['none', 'project', 'recent', 'organization'] as const;

export type ExecutiveMemoryMode = (typeof EXECUTIVE_MEMORY_MODES)[number];

export const EXECUTIVE_NAVIGATOR_MODES = [
  'next_step',
  'scale',
  'new_project',
  'none',
] as const;

export type ExecutiveNavigatorMode = (typeof EXECUTIVE_NAVIGATOR_MODES)[number];

/**
 * Unified pre-Gateway decision. `reasoning` is internal diagnostics only — never user-facing.
 */
export type ExecutiveDecision = {
  goal: ExecutiveGoal;
  workingMode: ExecutiveWorkingMode;
  projectDecision: ExecutiveProjectDecision;
  projectId: string | null;
  memoryMode: ExecutiveMemoryMode;
  navigatorMode: ExecutiveNavigatorMode;
  summary: string;
  reasoning: string[];
  confidence: number;
};

export type ExecutiveScope = {
  organizationId: string;
  userId?: string | null;
};

export type ExecutiveBrainResult = {
  request: import('@/types/runtime/dto').GatewayRequest;
  decision: ExecutiveDecision;
};
