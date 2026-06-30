export const NAVIGATOR_STEP_IDS = ['quick_result', 'build_system', 'scale'] as const;

export type NavigatorStepId = (typeof NAVIGATOR_STEP_IDS)[number];

export type NavigatorStep = {
  id: NavigatorStepId;
  emoji: string;
  title: string;
  description: string;
  buttonLabel: string;
};

export type NextBestStepContent = {
  title: string;
  subtitle: string;
  steps: NavigatorStep[];
};
