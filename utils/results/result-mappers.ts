import type { OrchestratorEvent, OrchestratorRun } from '@/types/orchestrator';
import { buildPaymentPlaceholder, type PaymentPlaceholderData } from '@/utils/billing/payment-placeholder';
import { isHomeGoalId } from '@/utils/home/goal-handoff';
import { extractRuntimeOutputText } from '@/utils/osa/runtime-output';
import { isOsaRun } from '@/utils/osa/osa-runs';
import { formatDateTime, formatDuration } from '@/utils/orchestrator/runs';
import {
  parseFindClientsDeliverable,
  type FindClientsSection,
} from '@/utils/results/find-clients-deliverable';
import {
  buildResultCelebration,
  buildResultPresentationHeadline,
  buildWhatsNextRecommendation,
  type ResultCelebrationData,
  type WhatsNextRecommendation,
} from '@/utils/home/wow-engine';

export const RESULT_ROUTE_PREFIX = '/results';

export type ResultStatusLabel = 'Completed' | 'In progress' | 'Preparing' | 'Needs attention';

export type ResultArtifactKind =
  | 'document'
  | 'strategy'
  | 'content'
  | 'report'
  | 'plan'
  | 'file'
  | 'output';

export type ResultArtifact = {
  id: string;
  title: string;
  kind: ResultArtifactKind;
  description: string;
  href: string | null;
};

export type ResultTimelineLabel =
  | 'Requested'
  | 'Started'
  | 'Working'
  | 'Completed'
  | 'Updated'
  | 'Issue found';

export type ResultTimelineEntry = {
  id: string;
  label: ResultTimelineLabel;
  detail: string;
  timestamp: string;
};

export type ResultNextStep = {
  id: string;
  label: string;
  href: string;
  primary?: boolean;
};

export type ResultAction = {
  id: string;
  label: string;
  href: string | null;
  disabled?: boolean;
};

export type ResultSummary = {
  requested: string;
  completed: string;
  keyOutcome: string;
};

export type ResultPrimaryActionData = {
  label: string;
  href: string;
};

export type ResultSecondaryActionData = {
  label: string;
  href: string;
};

export type ResultExperienceData = {
  enabled: boolean;
  goalId: string | null;
  goalTitle: string;
  metaLine: string;
  deliverableSections: FindClientsSection[];
  primaryAction: ResultPrimaryActionData;
  secondaryAction: ResultSecondaryActionData;
  paymentPlaceholder: PaymentPlaceholderData;
};

export type ResultData = {
  id: string;
  title: string;
  createdAt: string;
  status: ResultStatusLabel;
  projectName: string | null;
  projectHref: string | null;
  duration: string;
  summary: ResultSummary;
  artifacts: ResultArtifact[];
  nextSteps: ResultNextStep[];
  timeline: ResultTimelineEntry[];
  actions: ResultAction[];
  presentationHeadline: string;
  celebration: ResultCelebrationData;
  whatsNext: WhatsNextRecommendation;
  experience: ResultExperienceData;
};

export function buildResultHref(resultId: string): string {
  return `${RESULT_ROUTE_PREFIX}/${resultId}`;
}

export function mapResultStatus(status: OrchestratorRun['status']): ResultStatusLabel {
  switch (status) {
    case 'completed':
      return 'Completed';
    case 'failed':
    case 'cancelled':
      return 'Needs attention';
    case 'running':
      return 'In progress';
    case 'pending':
    default:
      return 'Preparing';
  }
}

function readProjectId(run: OrchestratorRun): string | null {
  const projectId = run.input.project_id ?? run.input.projectId;

  return typeof projectId === 'string' && projectId.trim().length > 0 ? projectId.trim() : null;
}

export function resolveResultTitle(run: OrchestratorRun): string {
  const prompt = run.input.user_prompt;

  if (typeof prompt === 'string' && prompt.trim().length > 0) {
    return prompt.trim();
  }

  const action = run.input.action;

  if (typeof action === 'string' && action.trim().length > 0) {
    return action.replace(/_/g, ' ');
  }

  if (run.input.goal_title && typeof run.input.goal_title === 'string') {
    return run.input.goal_title;
  }

  return 'Business result';
}

function resolveRequestedText(run: OrchestratorRun): string {
  const prompt = run.input.user_prompt;

  if (typeof prompt === 'string' && prompt.trim().length > 0) {
    return prompt.trim();
  }

  const businessDescription = run.input.businessDescription ?? run.input.business_description;

  if (typeof businessDescription === 'string' && businessDescription.trim().length > 0) {
    return businessDescription.trim();
  }

  return 'Work requested through the platform';
}

function resolveCompletedText(run: OrchestratorRun): string {
  if (run.status === 'failed') {
    return run.error_message?.trim() || 'This result could not be completed.';
  }

  if (run.status === 'running' || run.status === 'pending') {
    return 'Still in progress — check back shortly.';
  }

  const outputText = extractRuntimeOutputText(run.output);

  if (outputText) {
    return outputText;
  }

  const resultText = run.output?.resultText ?? run.output?.result_text;

  if (typeof resultText === 'string' && resultText.trim().length > 0) {
    return resultText.trim();
  }

  const message = run.output?.message;

  if (typeof message === 'string' && message.trim().length > 0) {
    return message.trim();
  }

  return 'The platform finished this request successfully.';
}

function readGoalId(run: OrchestratorRun): string | null {
  const goalId = run.input.goal_id ?? run.output?.goal_id;

  if (typeof goalId === 'string' && isHomeGoalId(goalId)) {
    return goalId;
  }

  return null;
}

function readGoalTitle(run: OrchestratorRun): string {
  const goalTitle = run.input.goal_title;

  if (typeof goalTitle === 'string' && goalTitle.trim().length > 0) {
    return goalTitle.trim();
  }

  return resolveResultTitle(run);
}

function readStoredKeyOutcome(run: OrchestratorRun): string | null {
  const keyOutcome = run.output?.key_outcome;

  if (typeof keyOutcome === 'string' && keyOutcome.trim().length > 0) {
    return keyOutcome.trim();
  }

  return null;
}

function formatResultMetaLine(goalTitle: string, projectName: string | null, createdAt: string): string {
  const parts = [goalTitle];

  if (projectName) {
    parts.push(`Saved to ${projectName}`);
  }

  const createdDate = new Date(createdAt);
  const now = new Date();
  const isToday =
    createdDate.getFullYear() === now.getFullYear() &&
    createdDate.getMonth() === now.getMonth() &&
    createdDate.getDate() === now.getDate();

  parts.push(isToday ? 'Today' : formatDateTime(createdAt));

  return parts.join(' · ');
}

function buildFindClientsCelebration(
  completedResultsCount: number,
  status: ResultStatusLabel,
): ResultCelebrationData {
  const isFirst = completedResultsCount <= 1;

  if (!isFirst || status !== 'Completed') {
    return {
      show: false,
      headline: '',
      message: '',
    };
  }

  return {
    show: true,
    headline: 'Your client acquisition plan is ready.',
    message: 'Everything below is yours to use today.',
  };
}

function buildFindClientsExperience(
  run: OrchestratorRun,
  projectName: string | null,
  projectHref: string | null,
  completedResultsCount: number,
): ResultExperienceData {
  const resultText = resolveCompletedText(run);
  const deliverable = parseFindClientsDeliverable(resultText);
  const goalTitle = readGoalTitle(run);
  const outreachHref = deliverable.outreachDraft
    ? `${buildResultHref(run.id)}#outreach-draft`
    : projectHref ?? '/home';

  return {
    enabled: deliverable.sections.length > 0,
    goalId: 'find_clients',
    goalTitle,
    metaLine: formatResultMetaLine(goalTitle, projectName, run.created_at),
    deliverableSections: deliverable.sections,
    primaryAction: {
      label: 'Send your first outreach today',
      href: outreachHref,
    },
    secondaryAction: {
      label: 'Continue tomorrow',
      href: '/home',
    },
    paymentPlaceholder: buildPaymentPlaceholder(completedResultsCount),
  };
}

function buildDefaultExperience(): ResultExperienceData {
  return {
    enabled: false,
    goalId: null,
    goalTitle: '',
    metaLine: '',
    deliverableSections: [],
    primaryAction: { label: '', href: '/home' },
    secondaryAction: { label: 'Continue tomorrow', href: '/home' },
    paymentPlaceholder: buildPaymentPlaceholder(0),
  };
}

function resolveKeyOutcome(run: OrchestratorRun): string {
  const stored = readStoredKeyOutcome(run);

  if (stored) {
    return stored;
  }

  const goalId = readGoalId(run);

  if (goalId === 'find_clients' && run.status === 'completed') {
    const deliverable = parseFindClientsDeliverable(resolveCompletedText(run));

    if (deliverable.keyOutcome) {
      return deliverable.keyOutcome;
    }
  }

  if (run.status === 'failed') {
    return 'Review the details below and try again from Today.';
  }

  const completed = resolveCompletedText(run);
  const firstSentence = completed.split(/[.!?]/)[0]?.trim();

  if (firstSentence && firstSentence.length > 0 && firstSentence.length <= 160) {
    return firstSentence;
  }

  return completed.length > 160 ? `${completed.slice(0, 157)}...` : completed;
}

function inferArtifactKind(run: OrchestratorRun): ResultArtifactKind {
  const prompt = `${run.input.user_prompt ?? ''} ${run.input.action ?? ''}`.toLowerCase();

  if (/plan|strategy|roadmap/.test(prompt)) {
    return 'plan';
  }

  if (/report|analysis|summary/.test(prompt)) {
    return 'report';
  }

  if (/content|copy|post|article|email/.test(prompt)) {
    return 'content';
  }

  return 'output';
}

export function mapResultArtifacts(run: OrchestratorRun): ResultArtifact[] {
  const artifacts: ResultArtifact[] = [];
  const outputText = resolveCompletedText(run);

  if (outputText && run.status === 'completed') {
    artifacts.push({
      id: `${run.id}-output`,
      title: 'Main deliverable',
      kind: inferArtifactKind(run),
      description: outputText.length > 220 ? `${outputText.slice(0, 217)}...` : outputText,
      href: null,
    });
  }

  const planSummary = run.input.execution_plan_summary ?? run.output?.plan_summary;

  if (typeof planSummary === 'string' && planSummary.trim().length > 0) {
    artifacts.push({
      id: `${run.id}-plan`,
      title: 'Work plan',
      kind: 'plan',
      description: planSummary.trim(),
      href: null,
    });
  }

  return artifacts;
}

function mapTimelineLabel(event: OrchestratorEvent): ResultTimelineLabel | null {
  switch (event.type) {
    case 'run_started':
    case 'osa_task_submitted':
      return 'Requested';
    case 'osa_runtime_started':
      return 'Started';
    case 'osa_progress_updated':
      return 'Working';
    case 'run_completed':
    case 'osa_runtime_completed':
      return 'Completed';
    case 'run_failed':
    case 'osa_runtime_failed':
      return 'Issue found';
    case 'osa_execution_plan_created':
    case 'osa_team_selected':
      return 'Updated';
    default:
      return null;
  }
}

function timelineDetail(label: ResultTimelineLabel): string {
  switch (label) {
    case 'Requested':
      return 'Your request was received.';
    case 'Started':
      return 'Work began on your request.';
    case 'Working':
      return 'The platform continued working on your request.';
    case 'Completed':
      return 'Your result is ready.';
    case 'Updated':
      return 'Progress was saved.';
    case 'Issue found':
      return 'Something blocked completion.';
    default:
      return 'Update recorded.';
  }
}

export function mapResultTimeline(run: OrchestratorRun, events: OrchestratorEvent[]): ResultTimelineEntry[] {
  const entries: ResultTimelineEntry[] = [];

  for (const event of events) {
    const label = mapTimelineLabel(event);

    if (!label) {
      continue;
    }

    entries.push({
      id: event.id,
      label,
      detail: timelineDetail(label),
      timestamp: event.created_at,
    });
  }

  if (entries.length === 0) {
    entries.push({
      id: `${run.id}-requested`,
      label: 'Requested',
      detail: timelineDetail('Requested'),
      timestamp: run.created_at,
    });

    if (run.started_at) {
      entries.push({
        id: `${run.id}-started`,
        label: 'Started',
        detail: timelineDetail('Started'),
        timestamp: run.started_at,
      });
    }

    if (run.status === 'running' || run.status === 'pending') {
      entries.push({
        id: `${run.id}-working`,
        label: 'Working',
        detail: timelineDetail('Working'),
        timestamp: run.started_at ?? run.created_at,
      });
    }

    if (run.completed_at) {
      entries.push({
        id: `${run.id}-completed`,
        label: run.status === 'failed' ? 'Issue found' : 'Completed',
        detail: timelineDetail(run.status === 'failed' ? 'Issue found' : 'Completed'),
        timestamp: run.completed_at,
      });
    }
  }

  return entries;
}

export function mapResultNextSteps(
  run: OrchestratorRun,
  projectHref: string | null,
): ResultNextStep[] {
  const steps: ResultNextStep[] = [
    {
      id: 'continue',
      label: 'Continue working',
      href: '/home',
      primary: true,
    },
    {
      id: 'improve',
      label: 'Improve result',
      href: '/home',
    },
  ];

  if (projectHref) {
    steps.push({
      id: 'project-task',
      label: 'Open project',
      href: projectHref,
    });
  } else {
    steps.push({
      id: 'create-project',
      label: 'Create project task',
      href: '/projects',
    });
  }

  steps.push(
    {
      id: 'share',
      label: 'Share',
      href: buildResultHref(run.id),
    },
    {
      id: 'export',
      label: 'Export',
      href: buildResultHref(run.id),
    },
  );

  return steps;
}

export function mapResultActions(run: OrchestratorRun): ResultAction[] {
  return [
    { id: 'continue', label: 'Continue', href: '/home' },
    { id: 'duplicate', label: 'Duplicate', href: '/home' },
    { id: 'export', label: 'Export', href: buildResultHref(run.id) },
    { id: 'archive', label: 'Archive', href: null, disabled: true },
    { id: 'delete', label: 'Delete', href: null, disabled: true },
  ];
}

export function mapRunToResult(
  run: OrchestratorRun,
  events: OrchestratorEvent[],
  projectName: string | null = null,
  completedResultsCount = 1,
): ResultData {
  const projectId = readProjectId(run);
  const projectHref = projectId ? `/projects/${projectId}` : null;
  const status = mapResultStatus(run.status);
  const goalId = readGoalId(run);
  const goalTitle = readGoalTitle(run);
  const keyOutcome = resolveKeyOutcome(run);
  const experience =
    goalId === 'find_clients' && status === 'Completed'
      ? buildFindClientsExperience(run, projectName, projectHref, completedResultsCount)
      : buildDefaultExperience();
  const celebration =
    goalId === 'find_clients'
      ? buildFindClientsCelebration(completedResultsCount, status)
      : buildResultCelebration(completedResultsCount, status);

  return {
    id: run.id,
    title: goalTitle,
    createdAt: formatDateTime(run.created_at),
    status,
    projectName,
    projectHref,
    duration: formatDuration(run.started_at, run.completed_at),
    summary: {
      requested: resolveRequestedText(run),
      completed: resolveCompletedText(run),
      keyOutcome,
    },
    artifacts: experience.enabled ? [] : mapResultArtifacts(run),
    nextSteps: experience.enabled ? [] : mapResultNextSteps(run, projectHref),
    timeline: mapResultTimeline(run, events),
    actions: experience.enabled ? [] : mapResultActions(run),
    presentationHeadline: experience.enabled ? keyOutcome : buildResultPresentationHeadline(status),
    celebration,
    whatsNext: buildWhatsNextRecommendation({
      goalTitle,
      projectHref,
      status,
    }),
    experience,
  };
}

export function resolveHistoryResultLabel(run: OrchestratorRun): string {
  return resolveResultTitle(run);
}

export function resolveHistoryResultContext(run: OrchestratorRun): string {
  if (isOsaRun(run)) {
    return 'Business task';
  }

  return 'Prepared for you';
}
