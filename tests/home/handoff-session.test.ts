import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { HomeHandoffSession } from '@/utils/home/goal-handoff';
import { buildHomeHandoffSession, mapHandoffContextFromSnapshot } from '@/utils/home/goal-handoff';
import {
  buildHandoffNavigationUrl,
  buildHandoffSessionInsert,
  calculateHandoffExpiresAt,
  canConsumeHandoffSession,
  HANDOFF_SESSION_TTL_MS,
  mapHandoffRowToOsaInput,
  mapHandoffSessionRow,
  parseHandoffIdFromSearchParams,
  shouldExpireHandoffSession,
  validateHandoffSessionAccess,
} from '@/utils/home/handoff-session';

const NOW = new Date('2026-06-28T12:00:00.000Z');
const EXPIRES = calculateHandoffExpiresAt(NOW);

function createDraftSession(
  sessionId = '00000000-0000-4000-8000-000000000001',
): HomeHandoffSession {
  return buildHomeHandoffSession(
    'find_clients',
    mapHandoffContextFromSnapshot({
      projectCount: 0,
      latestProject: null,
      runningExecution: null,
    }),
    sessionId,
  );
}

function createRow(
  overrides: Partial<ReturnType<typeof mapHandoffSessionRow>> = {},
): ReturnType<typeof mapHandoffSessionRow> {
  const draft = createDraftSession();

  return mapHandoffSessionRow({
    id: '00000000-0000-4000-8000-000000000001',
    organization_id: 'org-001',
    user_id: 'user-001',
    goal_id: draft.goalId,
    goal_title: draft.goalTitle,
    starter_prompt: draft.starterPrompt,
    recommended_team: draft.recommendedTeam,
    recommended_modules: draft.recommendedModules,
    recommended_project_type: draft.recommendedProjectType,
    created_project_id: null,
    status: 'created',
    created_at: NOW.toISOString(),
    expires_at: EXPIRES,
    consumed_at: null,
    metadata: {
      recommendedTeamIds: draft.recommendedTeamIds,
      hasActiveProject: false,
      activeProjectId: null,
      activeProjectName: null,
      resumeExecutionId: null,
      resumeExecutionHref: null,
      resumeExecutionLabel: null,
    },
    ...overrides,
  });
}

describe('handoff session', () => {
  it('creates session insert payload with 30 minute expiration', () => {
    const draft = createDraftSession();
    const insert = buildHandoffSessionInsert(draft, 'org-001', 'user-001', NOW);

    assert.equal(insert.status, 'created');
    assert.equal(insert.organization_id, 'org-001');
    assert.equal(insert.user_id, 'user-001');
    assert.equal(new Date(insert.expires_at).getTime() - NOW.getTime(), HANDOFF_SESSION_TTL_MS);
  });

  it('builds secure navigation url with handoff id only', () => {
    const url = buildHandoffNavigationUrl('00000000-0000-4000-8000-000000000099');

    assert.equal(url, '/workspace?handoff=00000000-0000-4000-8000-000000000099');
    assert.doesNotMatch(url, /starterPrompt=/);
    assert.doesNotMatch(url, /goalTitle=/);
  });

  it('parses handoff id from search params and ignores other values', () => {
    assert.equal(
      parseHandoffIdFromSearchParams({
        handoff: '00000000-0000-4000-8000-000000000099',
        goalId: 'find_clients',
        starterPrompt: 'ignored',
      }),
      '00000000-0000-4000-8000-000000000099',
    );
    assert.equal(parseHandoffIdFromSearchParams({ source: 'home' }), null);
  });

  it('maps persisted row to OSA input server-side', () => {
    const row = createRow();
    const handoff = mapHandoffRowToOsaInput(row);

    assert.equal(handoff.goalId, 'find_clients');
    assert.equal(handoff.source, 'home');
    assert.equal(handoff.sessionId, row.id);
    assert.equal(handoff.needsProject, true);
    assert.ok(handoff.recommendedTeam.length > 0);
  });

  it('opens valid created session for matching user and organization', () => {
    const row = createRow();
    const access = validateHandoffSessionAccess(row, 'org-001', 'user-001', NOW);

    assert.equal(access.status, 'ok');
  });

  it('rejects wrong organization and wrong user', () => {
    const row = createRow();

    assert.equal(validateHandoffSessionAccess(row, 'org-other', 'user-001', NOW).status, 'invalid');
    assert.equal(validateHandoffSessionAccess(row, 'org-001', 'user-other', NOW).status, 'invalid');
  });

  it('detects expired and consumed sessions', () => {
    const expired = createRow({
      expires_at: new Date(NOW.getTime() - 1000).toISOString(),
    });
    const consumed = createRow({ status: 'consumed', consumed_at: NOW.toISOString() });

    assert.equal(shouldExpireHandoffSession(expired, NOW), true);
    assert.equal(
      validateHandoffSessionAccess(expired, 'org-001', 'user-001', NOW).status,
      'expired',
    );
    assert.equal(
      validateHandoffSessionAccess(consumed, 'org-001', 'user-001', NOW).status,
      'consumed',
    );
    assert.equal(canConsumeHandoffSession(consumed, NOW), false);
  });

  it('allows consume for openable non-expired sessions and prevents reuse after consume', () => {
    const opened = createRow({ status: 'opened' });

    assert.equal(canConsumeHandoffSession(opened, NOW), true);

    const consumed = createRow({ status: 'consumed', consumed_at: NOW.toISOString() });
    assert.equal(canConsumeHandoffSession(consumed, NOW), false);
  });

  it('includes resume metadata without exposing it in the url', () => {
    const row = createRow({
      metadata: {
        recommendedTeamIds: ['business-manager', 'crm'],
        hasActiveProject: true,
        activeProjectId: 'project-001',
        activeProjectName: 'Marketing Launch',
        resumeExecutionId: 'run-001',
        resumeExecutionHref: '/results/run-001',
        resumeExecutionLabel: 'Grow revenue',
      },
    });
    const handoff = mapHandoffRowToOsaInput(row);
    const url = buildHandoffNavigationUrl(row.id);

    assert.equal(handoff.resumeRunId, 'run-001');
    assert.equal(handoff.needsProject, false);
    assert.doesNotMatch(url, /run-001/);
  });
});
