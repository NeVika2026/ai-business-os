import type { OrchestratorEvent, OrchestratorRun } from '@/types/orchestrator';
import { extractRuntimeOutputText } from '@/utils/osa/runtime-output';
import { isOsaRun } from '@/utils/osa/osa-runs';
import { formatDateTime, formatDuration } from '@/utils/orchestrator/runs';

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

function resolveKeyOutcome(run: OrchestratorRun): string {
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
): ResultData {
  const projectId = readProjectId(run);
  const projectHref = projectId ? `/projects/${projectId}` : null;

  return {
    id: run.id,
    title: resolveResultTitle(run),
    createdAt: formatDateTime(run.created_at),
    status: mapResultStatus(run.status),
    projectName,
    projectHref,
    duration: formatDuration(run.started_at, run.completed_at),
    summary: {
      requested: resolveRequestedText(run),
      completed: resolveCompletedText(run),
      keyOutcome: resolveKeyOutcome(run),
    },
    artifacts: mapResultArtifacts(run),
    nextSteps: mapResultNextSteps(run, projectHref),
    timeline: mapResultTimeline(run, events),
    actions: mapResultActions(run),
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
