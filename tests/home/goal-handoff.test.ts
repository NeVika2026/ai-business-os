import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  buildHomeHandoffNavigation,
  buildHomeHandoffSession,
  generateStarterPrompt,
  getHomeGoalDefinition,
  getHomeHandoffEventLabel,
  HOME_GOAL_DEFINITIONS,
  isHomeGoalId,
  mapHandoffContextFromSnapshot,
  resolveContinueWorkingMode,
} from '@/utils/home/goal-handoff';
import { buildHandoffNavigationUrl } from '@/utils/home/handoff-session';

describe('goal handoff', () => {
  it('maps supported goals with full model fields', () => {
    assert.equal(HOME_GOAL_DEFINITIONS.length, 8);
    const goal = getHomeGoalDefinition('find_clients');

    assert.equal(goal.title, 'Find Clients');
    assert.equal(goal.category, 'growth');
    assert.equal(goal.priority, 'high');
    assert.ok(goal.recommendedModules.includes('crm'));
    assert.ok(goal.starterPrompt.length > 0);
    assert.equal(goal.suggestedProjectType, 'crm');
  });

  it('generates starter prompt with project context', () => {
    const prompt = generateStarterPrompt('launch_project', {
      projectCount: 1,
      activeProjectId: 'project-001',
      activeProjectName: 'Launch HQ',
      resumeExecutionId: null,
      resumeExecutionHref: null,
      resumeExecutionLabel: null,
    });

    assert.match(prompt, /Launch HQ/);
  });

  it('builds draft handoff session for persistence', () => {
    const context = mapHandoffContextFromSnapshot({
      projectCount: 0,
      latestProject: null,
      runningExecution: null,
    });
    const { session } = buildHomeHandoffNavigation('dont_know', context, 'session-001');

    assert.equal(session.goalTitle, "Don't Know Where To Start");
    assert.equal(session.source, 'home');
    assert.equal(session.hasActiveProject, false);
  });

  it('prefers resume flow when execution exists', () => {
    const context = mapHandoffContextFromSnapshot({
      projectCount: 2,
      latestProject: { id: 'project-001', name: 'Marketing Launch' },
      runningExecution: {
        id: 'run-001',
        label: 'Grow revenue',
        href: '/orchestrator/runs/run-001',
      },
    });
    const session = buildHomeHandoffSession('increase_revenue', context, 'session-002');
    const resume = resolveContinueWorkingMode(context);

    assert.equal(session.resumeExecutionId, 'run-001');
    assert.equal(resume.preferResume, true);
    assert.equal(resume.resumeLabel, 'Resume execution');
  });

  it('uses existing project context without forcing project creation', () => {
    const context = mapHandoffContextFromSnapshot({
      projectCount: 1,
      latestProject: { id: 'project-001', name: 'Marketing Launch' },
      runningExecution: null,
    });
    const session = buildHomeHandoffSession('create_content', context, 'session-003');

    assert.equal(session.hasActiveProject, true);
    assert.equal(session.activeProjectName, 'Marketing Launch');
  });

  it('exposes server-side handoff event labels', () => {
    assert.equal(getHomeHandoffEventLabel('home_handoff_created'), 'Handoff session created');
    assert.equal(getHomeHandoffEventLabel('home_handoff_consumed'), 'Handoff session consumed');
    assert.equal(isHomeGoalId('learn_ai'), false);
  });

  it('builds secure navigation url from handoff id', () => {
    const url = buildHandoffNavigationUrl('00000000-0000-4000-8000-000000000099');

    assert.match(url, /^\/osa\?handoff=/);
    assert.doesNotMatch(url, /goalId=/);
  });
});
