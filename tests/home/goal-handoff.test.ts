import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  buildHomeHandoffEvents,
  buildHomeHandoffNavigation,
  buildHomeHandoffSession,
  buildOsaHandoffUrl,
  generateStarterPrompt,
  getHomeGoalDefinition,
  getHomeHandoffEventLabel,
  HOME_GOAL_DEFINITIONS,
  isHomeGoalId,
  mapHandoffContextFromSnapshot,
  parseOsaHomeHandoffInput,
  resolveContinueWorkingMode,
  writeStoredHomeSession,
} from '@/utils/home/goal-handoff';

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

  it('builds handoff session and navigation url for OSA', () => {
    const context = mapHandoffContextFromSnapshot({
      projectCount: 0,
      latestProject: null,
      runningExecution: null,
    });
    const navigation = buildHomeHandoffNavigation('dont_know', context, 'session-001');

    assert.equal(navigation.session.goalTitle, "Don't Know Where To Start");
    assert.equal(navigation.session.source, 'home');
    assert.equal(navigation.session.hasActiveProject, false);
    assert.match(navigation.url, /^\/osa\?/);
    assert.match(navigation.url, /source=home/);
    assert.match(navigation.url, /goalId=dont_know/);
    assert.match(navigation.url, /needsProject=1/);
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
    const url = buildOsaHandoffUrl(session);
    const resume = resolveContinueWorkingMode(context);

    assert.equal(session.resumeExecutionId, 'run-001');
    assert.match(url, /resumeRunId=run-001/);
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
    assert.doesNotMatch(buildOsaHandoffUrl(session), /needsProject=1/);
  });

  it('parses OSA handoff search params', () => {
    const handoff = parseOsaHomeHandoffInput({
      source: 'home',
      goalId: 'automate_routine',
      goalTitle: 'Automate Work',
      starterPrompt: 'Automate my routine',
      recommendedTeam: 'Business Manager|Analyst',
      recommendedTeamIds: 'business-manager|analyst',
      recommendedModules: 'osa|automation',
      recommendedProjectType: 'automation',
      sessionId: 'session-004',
      needsProject: '1',
    });

    assert.ok(handoff);
    assert.equal(handoff?.goalTitle, 'Automate Work');
    assert.equal(handoff?.recommendedTeam.length, 2);
    assert.equal(handoff?.needsProject, true);
    assert.equal(handoff?.source, 'home');
  });

  it('builds history events with timeline labels', () => {
    const session = buildHomeHandoffSession(
      'organize_business',
      mapHandoffContextFromSnapshot({
        projectCount: 0,
        latestProject: null,
        runningExecution: null,
      }),
      '00000000-0000-4000-8000-000000000099',
    );
    const events = buildHomeHandoffEvents(session, 'org-001', 'user-001');

    assert.equal(events.length, 3);
    assert.equal(events[0]?.type, 'home_goal_selected');
    assert.equal(events[1]?.type, 'goal_handoff_started');
    assert.equal(events[2]?.type, 'goal_handoff_completed');
    assert.equal(getHomeHandoffEventLabel('goal_handoff_completed'), 'Workspace prepared');
  });

  it('persists home session in organization settings', () => {
    const session = buildHomeHandoffSession(
      'understand_ai',
      mapHandoffContextFromSnapshot({
        projectCount: 0,
        latestProject: null,
        runningExecution: null,
      }),
      'session-005',
    );
    const settings = writeStoredHomeSession({}, 'user-001', session);

    assert.equal(isHomeGoalId('learn_ai'), false);
    assert.equal((settings.home_sessions as Record<string, unknown>)['user-001'], session);
    assert.equal(settings.last_home_goal_id, 'understand_ai');
  });
});
