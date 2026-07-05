export type InvestorDemoStep =
  | 'first_contact'
  | 'briefing'
  | 'workspace'
  | 'decision'
  | 'orchestra_continue'
  | 'memory'
  | 'replay'
  | 'complete';

export const INVESTOR_DEMO_STEP_ORDER: InvestorDemoStep[] = [
  'first_contact',
  'briefing',
  'workspace',
  'decision',
  'orchestra_continue',
  'memory',
  'replay',
  'complete',
];

export const INVESTOR_DEMO_STEP_DURATION_MS: Record<
  Exclude<InvestorDemoStep, 'first_contact' | 'complete'>,
  number
> = {
  briefing: 8_000,
  workspace: 10_000,
  decision: 10_000,
  orchestra_continue: 8_000,
  memory: 10_000,
  replay: 10_000,
};

export function nextInvestorDemoStep(step: InvestorDemoStep): InvestorDemoStep | null {
  const index = INVESTOR_DEMO_STEP_ORDER.indexOf(step);

  if (index < 0 || index >= INVESTOR_DEMO_STEP_ORDER.length - 1) {
    return null;
  }

  return INVESTOR_DEMO_STEP_ORDER[index + 1] ?? null;
}

export function investorDemoStepDuration(step: InvestorDemoStep): number | null {
  if (step === 'first_contact' || step === 'complete') {
    return null;
  }

  return INVESTOR_DEMO_STEP_DURATION_MS[step];
}

export function totalInvestorDemoDurationMs(): number {
  return Object.values(INVESTOR_DEMO_STEP_DURATION_MS).reduce((total, value) => total + value, 0);
}
