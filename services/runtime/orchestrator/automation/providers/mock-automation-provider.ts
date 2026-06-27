import type {
  AutomationProvider,
  AutomationSession,
} from '@/services/runtime/orchestrator/automation/automation-types';

export class MockAutomationProvider implements AutomationProvider {
  private readonly sessions = new Map<string, AutomationSession>();

  save(session: AutomationSession): void {
    this.sessions.set(session.plan.id, session);
  }

  update(session: AutomationSession): void {
    this.sessions.set(session.plan.id, session);
  }

  get(planId: string): AutomationSession | null {
    return this.sessions.get(planId) ?? null;
  }

  reset(): void {
    this.sessions.clear();
  }
}

export function createMockAutomationProvider(): MockAutomationProvider {
  return new MockAutomationProvider();
}

/** Shared in-memory store for local dev and tests. */
export const mockAutomationProvider = createMockAutomationProvider();
