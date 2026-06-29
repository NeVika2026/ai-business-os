import { randomUUID } from 'node:crypto';

import type { SupabaseClient } from '@supabase/supabase-js';

import type { ProjectType } from '@/utils/projects/project-types';
import {
  HOME_EVENT_SOURCE,
  type HomeHandoffSession,
  type OsaHomeHandoffInput,
} from '@/utils/home/goal-handoff';

export const HANDOFF_SESSION_TTL_MS = 30 * 60 * 1000;

export const HANDOFF_SESSION_STATUSES = [
  'created',
  'opened',
  'consumed',
  'expired',
  'cancelled',
] as const;

export type HandoffSessionStatus = (typeof HANDOFF_SESSION_STATUSES)[number];

export type HandoffSessionEventType =
  | 'home_handoff_created'
  | 'home_handoff_opened'
  | 'home_handoff_consumed'
  | 'home_handoff_expired';

export const HANDOFF_SESSION_EVENT_LABELS: Record<HandoffSessionEventType, string> = {
  home_handoff_created: 'Handoff session created',
  home_handoff_opened: 'Handoff session opened',
  home_handoff_consumed: 'Handoff session consumed',
  home_handoff_expired: 'Handoff session expired',
};

export type HandoffSessionMetadata = {
  recommendedTeamIds: string[];
  hasActiveProject: boolean;
  activeProjectId: string | null;
  activeProjectName: string | null;
  resumeExecutionId: string | null;
  resumeExecutionHref: string | null;
  resumeExecutionLabel: string | null;
};

export type HandoffSessionRow = {
  id: string;
  organization_id: string;
  user_id: string;
  goal_id: string;
  goal_title: string;
  starter_prompt: string;
  recommended_team: string[];
  recommended_modules: string[];
  recommended_project_type: string;
  created_project_id: string | null;
  status: HandoffSessionStatus;
  created_at: string;
  expires_at: string;
  consumed_at: string | null;
  metadata: HandoffSessionMetadata;
};

export type HandoffSessionInsert = {
  organization_id: string;
  user_id: string;
  goal_id: string;
  goal_title: string;
  starter_prompt: string;
  recommended_team: string[];
  recommended_modules: string[];
  recommended_project_type: string;
  status: HandoffSessionStatus;
  expires_at: string;
  metadata: HandoffSessionMetadata;
};

export type HandoffAccessResult =
  | { status: 'ok'; row: HandoffSessionRow }
  | { status: 'expired'; row: HandoffSessionRow | null }
  | { status: 'invalid'; row: HandoffSessionRow | null }
  | { status: 'consumed'; row: HandoffSessionRow | null };

export type OpenHandoffSessionResult =
  | { status: 'ok'; handoff: OsaHomeHandoffInput; handoffId: string }
  | { status: 'expired' | 'invalid' | 'consumed' };

export type CreateHandoffSessionResult = {
  handoffId: string;
  url: string;
};

const OPENABLE_STATUSES = new Set<HandoffSessionStatus>(['created', 'opened']);
const ACTIVE_STATUSES = new Set<HandoffSessionStatus>(['created', 'opened']);

export function calculateHandoffExpiresAt(
  createdAt: Date,
  ttlMs: number = HANDOFF_SESSION_TTL_MS,
): string {
  return new Date(createdAt.getTime() + ttlMs).toISOString();
}

export function buildHandoffNavigationUrl(handoffId: string): string {
  return `/workspace?handoff=${encodeURIComponent(handoffId)}`;
}

export function parseHandoffIdFromSearchParams(
  searchParams: Record<string, string | string[] | undefined>,
): string | null {
  const value = searchParams.handoff;

  if (Array.isArray(value)) {
    return value[0]?.trim() || null;
  }

  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

export function buildHandoffSessionMetadata(session: HomeHandoffSession): HandoffSessionMetadata {
  return {
    recommendedTeamIds: session.recommendedTeamIds,
    hasActiveProject: session.hasActiveProject,
    activeProjectId: session.activeProjectId,
    activeProjectName: session.activeProjectName,
    resumeExecutionId: session.resumeExecutionId,
    resumeExecutionHref: session.resumeExecutionHref,
    resumeExecutionLabel: session.resumeExecutionLabel,
  };
}

export function buildHandoffSessionInsert(
  session: HomeHandoffSession,
  organizationId: string,
  userId: string,
  createdAt: Date = new Date(),
): HandoffSessionInsert {
  return {
    organization_id: organizationId,
    user_id: userId,
    goal_id: session.goalId,
    goal_title: session.goalTitle,
    starter_prompt: session.starterPrompt,
    recommended_team: session.recommendedTeam,
    recommended_modules: session.recommendedModules,
    recommended_project_type: session.recommendedProjectType,
    status: 'created',
    expires_at: calculateHandoffExpiresAt(createdAt),
    metadata: buildHandoffSessionMetadata(session),
  };
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry): entry is string => typeof entry === 'string');
}

function normalizeMetadata(value: unknown): HandoffSessionMetadata {
  const metadata =
    value && typeof value === 'object' ? (value as Partial<HandoffSessionMetadata>) : {};

  return {
    recommendedTeamIds: normalizeStringArray(metadata.recommendedTeamIds),
    hasActiveProject: metadata.hasActiveProject === true,
    activeProjectId: typeof metadata.activeProjectId === 'string' ? metadata.activeProjectId : null,
    activeProjectName:
      typeof metadata.activeProjectName === 'string' ? metadata.activeProjectName : null,
    resumeExecutionId:
      typeof metadata.resumeExecutionId === 'string' ? metadata.resumeExecutionId : null,
    resumeExecutionHref:
      typeof metadata.resumeExecutionHref === 'string' ? metadata.resumeExecutionHref : null,
    resumeExecutionLabel:
      typeof metadata.resumeExecutionLabel === 'string' ? metadata.resumeExecutionLabel : null,
  };
}

export function mapHandoffSessionRow(row: Record<string, unknown>): HandoffSessionRow {
  return {
    id: String(row.id),
    organization_id: String(row.organization_id),
    user_id: String(row.user_id),
    goal_id: String(row.goal_id),
    goal_title: String(row.goal_title),
    starter_prompt: String(row.starter_prompt),
    recommended_team: normalizeStringArray(row.recommended_team),
    recommended_modules: normalizeStringArray(row.recommended_modules),
    recommended_project_type: String(row.recommended_project_type),
    created_project_id: typeof row.created_project_id === 'string' ? row.created_project_id : null,
    status: row.status as HandoffSessionStatus,
    created_at: String(row.created_at),
    expires_at: String(row.expires_at),
    consumed_at: typeof row.consumed_at === 'string' ? row.consumed_at : null,
    metadata: normalizeMetadata(row.metadata),
  };
}

export function mapHandoffRowToOsaInput(row: HandoffSessionRow): OsaHomeHandoffInput {
  return {
    goalId: row.goal_id,
    goalTitle: row.goal_title,
    starterPrompt: row.starter_prompt,
    recommendedTeam: row.recommended_team,
    recommendedTeamIds: row.metadata.recommendedTeamIds,
    recommendedModules: row.recommended_modules,
    recommendedProjectType: row.recommended_project_type as ProjectType,
    source: 'home',
    sessionId: row.id,
    resumeRunId: row.metadata.resumeExecutionId,
    resumeRunHref: row.metadata.resumeExecutionHref,
    resumeRunLabel: row.metadata.resumeExecutionLabel,
    needsProject: !row.metadata.hasActiveProject,
    activeProjectName: row.metadata.activeProjectName,
  };
}

export function isHandoffSessionExpired(row: HandoffSessionRow, now: Date = new Date()): boolean {
  return new Date(row.expires_at).getTime() <= now.getTime();
}

export function shouldExpireHandoffSession(
  row: HandoffSessionRow,
  now: Date = new Date(),
): boolean {
  return ACTIVE_STATUSES.has(row.status) && isHandoffSessionExpired(row, now);
}

export function validateHandoffSessionAccess(
  row: HandoffSessionRow | null,
  organizationId: string,
  userId: string,
  now: Date = new Date(),
): HandoffAccessResult {
  if (!row) {
    return { status: 'invalid', row: null };
  }

  if (row.organization_id !== organizationId || row.user_id !== userId) {
    return { status: 'invalid', row };
  }

  if (row.status === 'consumed') {
    return { status: 'consumed', row };
  }

  if (row.status === 'expired' || row.status === 'cancelled') {
    return { status: 'expired', row };
  }

  if (shouldExpireHandoffSession(row, now)) {
    return { status: 'expired', row };
  }

  if (!OPENABLE_STATUSES.has(row.status)) {
    return { status: 'invalid', row };
  }

  return { status: 'ok', row };
}

export function canConsumeHandoffSession(row: HandoffSessionRow, now: Date = new Date()): boolean {
  const access = validateHandoffSessionAccess(row, row.organization_id, row.user_id, now);

  return access.status === 'ok';
}

export function buildHandoffSessionEvent(
  type: HandoffSessionEventType,
  row: HandoffSessionRow,
  userId: string,
) {
  return {
    organization_id: row.organization_id,
    type,
    source: HOME_EVENT_SOURCE,
    actor_type: 'user',
    actor_id: userId,
    correlation_id: row.id,
    payload: {
      handoff_id: row.id,
      goal_id: row.goal_id,
      goal_title: row.goal_title,
      status: row.status,
    },
  };
}

export function getHandoffSessionEventLabel(type: string): string | null {
  if (type in HANDOFF_SESSION_EVENT_LABELS) {
    return HANDOFF_SESSION_EVENT_LABELS[type as HandoffSessionEventType];
  }

  return null;
}

async function insertHandoffEvent(
  supabase: SupabaseClient,
  type: HandoffSessionEventType,
  row: HandoffSessionRow,
  userId: string,
) {
  const { error } = await supabase
    .from('events')
    .insert(buildHandoffSessionEvent(type, row, userId));

  if (error) {
    throw error;
  }
}

export async function createPersistedHandoffSession(
  supabase: SupabaseClient,
  session: HomeHandoffSession,
  organizationId: string,
  userId: string,
): Promise<CreateHandoffSessionResult> {
  const insert = buildHandoffSessionInsert(session, organizationId, userId);
  const { data, error } = await supabase
    .from('home_handoff_sessions')
    .insert(insert)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  const row = mapHandoffSessionRow(data);
  await insertHandoffEvent(supabase, 'home_handoff_created', row, userId);

  return {
    handoffId: row.id,
    url: buildHandoffNavigationUrl(row.id),
  };
}

async function markHandoffSessionExpired(
  supabase: SupabaseClient,
  row: HandoffSessionRow,
  userId: string,
): Promise<HandoffSessionRow> {
  const { data, error } = await supabase
    .from('home_handoff_sessions')
    .update({ status: 'expired' })
    .eq('id', row.id)
    .eq('organization_id', row.organization_id)
    .eq('user_id', userId)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  const expiredRow = mapHandoffSessionRow(data);
  await insertHandoffEvent(supabase, 'home_handoff_expired', expiredRow, userId);

  return expiredRow;
}

export async function openHandoffSession(
  supabase: SupabaseClient,
  handoffId: string,
  organizationId: string,
  userId: string,
): Promise<OpenHandoffSessionResult> {
  const { data, error } = await supabase
    .from('home_handoff_sessions')
    .select('*')
    .eq('id', handoffId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  const row = data ? mapHandoffSessionRow(data) : null;
  const access = validateHandoffSessionAccess(row, organizationId, userId);

  if (access.status === 'expired' && row) {
    if (row.status !== 'expired') {
      await markHandoffSessionExpired(supabase, row, userId);
    }

    return { status: 'expired' };
  }

  if (access.status !== 'ok' || !row) {
    return { status: access.status === 'consumed' ? 'consumed' : 'invalid' };
  }

  let openedRow = row;

  if (row.status === 'created') {
    const { data: updated, error: updateError } = await supabase
      .from('home_handoff_sessions')
      .update({ status: 'opened' })
      .eq('id', row.id)
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .eq('status', 'created')
      .select('*')
      .single();

    if (updateError) {
      throw updateError;
    }

    openedRow = mapHandoffSessionRow(updated);
    await insertHandoffEvent(supabase, 'home_handoff_opened', openedRow, userId);
  }

  return {
    status: 'ok',
    handoffId: openedRow.id,
    handoff: mapHandoffRowToOsaInput(openedRow),
  };
}

export async function consumeHandoffSession(
  supabase: SupabaseClient,
  handoffId: string,
  organizationId: string,
  userId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from('home_handoff_sessions')
    .select('*')
    .eq('id', handoffId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  const row = data ? mapHandoffSessionRow(data) : null;

  if (!row || !canConsumeHandoffSession(row)) {
    return false;
  }

  if (row.organization_id !== organizationId || row.user_id !== userId) {
    return false;
  }

  const consumedAt = new Date().toISOString();
  const { data: updated, error: updateError } = await supabase
    .from('home_handoff_sessions')
    .update({
      status: 'consumed',
      consumed_at: consumedAt,
    })
    .eq('id', handoffId)
    .eq('organization_id', organizationId)
    .eq('user_id', userId)
    .in('status', ['created', 'opened'])
    .select('*')
    .single();

  if (updateError || !updated) {
    return false;
  }

  const consumedRow = mapHandoffSessionRow(updated);
  await insertHandoffEvent(supabase, 'home_handoff_consumed', consumedRow, userId);

  return true;
}

export async function expireOldHandoffs(
  supabase: SupabaseClient,
  organizationId?: string,
): Promise<number> {
  const nowIso = new Date().toISOString();
  let query = supabase
    .from('home_handoff_sessions')
    .select('*')
    .in('status', ['created', 'opened'])
    .lte('expires_at', nowIso);

  if (organizationId) {
    query = query.eq('organization_id', organizationId);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  const rows = (data ?? []).map(mapHandoffSessionRow);

  for (const row of rows) {
    await markHandoffSessionExpired(supabase, row, row.user_id);
  }

  return rows.length;
}

export function createDraftHandoffSessionId(): string {
  return randomUUID();
}
