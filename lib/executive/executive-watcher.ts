import { getLastExecutiveDecision } from '@/lib/executive/executive-engine';
import { findRuntimeEvents } from '@/lib/events/event-runtime';
import { getRuntimeStorage } from '@/lib/storage/storage-factory';
import { RUNTIME_EVENT_TYPES } from '@/types/event-runtime';
import type {
  ExecutiveAttentionActionKind,
  ExecutiveAttentionItem,
  ExecutiveAttentionPriority,
  ExecutiveAttentionSnapshot,
} from '@/types/executive-attention';
import type { ExecutiveScope } from '@/types/executive';
import type { CabinetRawSnapshot } from '@/utils/cabinet/dashboard-mappers';
import type { ConciergeData } from '@/utils/home/concierge-mappers';
import { buildExecutiveWorkspaceView } from '@/utils/workspace/executive-workspace-view';
import type { OsaWorkspacePageData } from '@/utils/workspace/workspace-types';

const STALE_DAYS = 2;
const LOW_DELIVERABLE_SCORE = 70;
const LOW_PROGRESS_PERCENT = 35;
const RECURRING_ERROR_THRESHOLD = 2;

type BuildExecutiveAttentionInput = {
  scope: ExecutiveScope;
  snapshot: CabinetRawSnapshot;
  concierge: ConciergeData;
  workspace: OsaWorkspacePageData | null;
  now?: Date;
};

function workspaceHref(projectId: string | null): string | null {
  return projectId ? `/workspace/${projectId}` : null;
}

function daysSince(value: string | null | undefined, now: Date): number {
  if (!value) {
    return Number.POSITIVE_INFINITY;
  }

  return (now.getTime() - new Date(value).getTime()) / (24 * 60 * 60 * 1000);
}

function priorityRank(priority: ExecutiveAttentionPriority): number {
  switch (priority) {
    case 'high':
      return 0;
    case 'medium':
      return 1;
    case 'low':
      return 2;
  }
}

function dedupeItems(items: ExecutiveAttentionItem[]): ExecutiveAttentionItem[] {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = `${item.projectId ?? 'org'}:${item.title}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function sortItems(items: ExecutiveAttentionItem[]): ExecutiveAttentionItem[] {
  return [...items].sort((left, right) => priorityRank(left.priority) - priorityRank(right.priority));
}

function createItem(input: {
  id: string;
  projectId?: string | null;
  projectName?: string | null;
  title: string;
  cause: string;
  consequence: string;
  recommendation: string;
  priority: ExecutiveAttentionPriority;
  actionKind: ExecutiveAttentionActionKind;
}): ExecutiveAttentionItem {
  const projectId = input.projectId ?? null;

  return {
    id: input.id,
    projectId,
    projectName: input.projectName ?? null,
    title: input.title,
    cause: input.cause,
    consequence: input.consequence,
    recommendation: input.recommendation,
    priority: input.priority,
    actionKind: input.actionKind,
    href: workspaceHref(projectId),
  };
}

function scanStaleProjects(snapshot: CabinetRawSnapshot, now: Date): ExecutiveAttentionItem[] {
  const items: ExecutiveAttentionItem[] = [];

  for (const project of snapshot.projects) {
    if (project.status !== 'active') {
      continue;
    }

    const idleDays = daysSince(project.updated_at, now);

    if (idleDays < STALE_DAYS) {
      continue;
    }

    const roundedDays = Math.max(STALE_DAYS, Math.floor(idleDays));

    items.push(
      createItem({
        id: `stale:${project.id}`,
        projectId: project.id,
        projectName: project.name,
        title: project.name,
        cause: `Нет прогресса ${roundedDays} ${roundedDays === 1 ? 'день' : roundedDays < 5 ? 'дня' : 'дней'}.`,
        consequence: 'Проект теряет momentum — команда простаивает, сроки сдвигаются.',
        recommendation: 'Открыть Workspace и запустить следующий шаг Orchestra.',
        priority: idleDays >= STALE_DAYS + 1 ? 'high' : 'medium',
        actionKind: 'open_workspace',
      }),
    );
  }

  return items;
}

function scanFailedRuns(snapshot: CabinetRawSnapshot): ExecutiveAttentionItem[] {
  const failedRuns = snapshot.runs.filter((run) => run.status === 'failed');

  if (failedRuns.length === 0) {
    return [];
  }

  const priority: ExecutiveAttentionPriority =
    failedRuns.length >= RECURRING_ERROR_THRESHOLD ? 'high' : 'medium';

  return [
    createItem({
      id: 'runs:failed',
      title: 'Повторяющиеся ошибки AI',
      cause:
        failedRuns.length >= RECURRING_ERROR_THRESHOLD
          ? `${failedRuns.length} AI run завершились с ошибкой.`
          : 'Последний AI run завершился с ошибкой.',
      consequence: 'Deliverables не создаются, Orchestra теряет темп.',
      recommendation: 'Перераспределить AI-команду и повторить задачу с Executive Brain.',
      priority,
      actionKind: 'redistribute_team',
    }),
  ];
}

function scanPromptFailures(projectId: string | null, projectName: string | null): ExecutiveAttentionItem[] {
  const failures = findRuntimeEvents(getRuntimeStorage(), (event) =>
    event.type === RUNTIME_EVENT_TYPES.WORKSPACE_PROMPT_FAILED,
  );

  if (failures.length === 0) {
    return [];
  }

  const scopedFailures = projectId
    ? failures.filter((event) => event.projectId === projectId)
    : failures;

  if (scopedFailures.length === 0) {
    return [];
  }

  return [
    createItem({
      id: `prompt-failed:${projectId ?? 'org'}`,
      projectId,
      projectName,
      title: projectName ?? 'Workspace',
      cause:
        scopedFailures.length >= RECURRING_ERROR_THRESHOLD
          ? `${scopedFailures.length} запроса в Workspace завершились ошибкой Gateway.`
          : 'Последний запрос в Workspace не прошёл через Gateway.',
      consequence: 'Executive Brain не получил результат для следующего решения.',
      recommendation: 'Повторить Improve или изменить порядок работ в Orchestra.',
      priority: scopedFailures.length >= RECURRING_ERROR_THRESHOLD ? 'high' : 'medium',
      actionKind: 'reorder_work',
    }),
  ];
}

function scanHealth(snapshot: CabinetRawSnapshot): ExecutiveAttentionItem[] {
  const items: ExecutiveAttentionItem[] = [];

  for (const [key, status] of Object.entries(snapshot.health)) {
    if (status !== 'warning' && status !== 'offline') {
      continue;
    }

    items.push(
      createItem({
        id: `health:${key}`,
        title: `Подсистема ${key}`,
        cause: `Статус ${status === 'offline' ? 'offline' : 'warning'}.`,
        consequence: 'Часть автоматизации может работать без Memory или Gateway.',
        recommendation: 'Запросить решение пользователя перед следующим AI run.',
        priority: status === 'offline' ? 'high' : 'medium',
        actionKind: 'request_decision',
      }),
    );
  }

  return items;
}

function scanConciergeWarnings(concierge: ConciergeData): ExecutiveAttentionItem[] {
  return concierge.insights
    .filter((insight) => insight.tone === 'warning')
    .map((insight) =>
      createItem({
        id: `insight:${insight.id}`,
        title: 'Executive Brain заметил отклонение',
        cause: insight.message,
        consequence: 'Контекст проекта используется не полностью.',
        recommendation: 'Подключить Knowledge или перераспределить AI-команду.',
        priority: 'medium',
        actionKind: 'redistribute_team',
      }),
    );
}

function scanWorkspaceAttention(
  workspace: OsaWorkspacePageData,
  scope: ExecutiveScope,
): ExecutiveAttentionItem[] {
  const items: ExecutiveAttentionItem[] = [];
  const projectId = workspace.projectId;
  const projectName = workspace.header.title;
  const view = buildExecutiveWorkspaceView(workspace);
  const executive = getLastExecutiveDecision(scope);

  if (workspace.today.progressPercent < LOW_PROGRESS_PERCENT && workspace.header.status !== 'Completed') {
    items.push(
      createItem({
        id: `progress:${projectId}`,
        projectId,
        projectName,
        title: projectName,
        cause: `Прогресс ${workspace.today.progressPercent}% — ниже рабочего порога.`,
        consequence: 'Mission Control не видит движения по deliverables и Orchestra.',
        recommendation: 'Запустить Designer или подтвердить решение Orchestra.',
        priority: 'medium',
        actionKind: 'open_workspace',
      }),
    );
  }

  const idleDays = daysSince(workspace.header.lastActivity, new Date());

  if (idleDays >= STALE_DAYS) {
    items.push(
      createItem({
        id: `workspace-stale:${projectId}`,
        projectId,
        projectName,
        title: projectName,
        cause: `Нет активности ${Math.floor(idleDays)} дн.`,
        consequence: 'Executive Memory не пополняется новыми решениями.',
        recommendation: 'Открыть Workspace и выполнить Next Best Action.',
        priority: idleDays >= STALE_DAYS + 1 ? 'high' : 'medium',
        actionKind: 'open_workspace',
      }),
    );
  }

  for (const agent of workspace.orchestra?.queue ?? []) {
    if (agent.status === 'blocked') {
      items.push(
        createItem({
          id: `blocked:${projectId}:${agent.id}`,
          projectId,
          projectName,
          title: `${agent.role} заблокирован`,
          cause: agent.blockedReason ?? 'Orchestra ждёт подтверждения CEO.',
          consequence: 'Deliverables и следующий этап команды остановлены.',
          recommendation: 'Запросить решение пользователя и подтвердить в Workspace.',
          priority: 'high',
          actionKind: 'request_decision',
        }),
      );
    }
  }

  if (workspace.orchestra?.reviewRequired) {
    items.push(
      createItem({
        id: `decision:${projectId}`,
        projectId,
        projectName,
        title: 'Незавершённое решение Orchestra',
        cause: 'Executive Brain зафиксировал reviewRequired в AI Orchestra.',
        consequence: 'Команда не переходит к следующему deliverable.',
        recommendation: 'Подтвердить решение или изменить порядок работ.',
        priority: 'high',
        actionKind: 'request_decision',
      }),
    );
  }

  if (
    workspace.orchestra &&
    workspace.orchestra.queue.length > 0 &&
    !workspace.orchestra.queue.some((agent) => agent.status === 'working') &&
    workspace.orchestra.overallProgress < 100
  ) {
    items.push(
      createItem({
        id: `orchestra-idle:${projectId}`,
        projectId,
        projectName,
        title: 'AI Orchestra простаивает',
        cause: 'Нет активного агента при незавершённой очереди.',
        consequence: 'Deliverables не двигаются к Ready.',
        recommendation: 'Перераспределить AI-команду или запустить Designer.',
        priority: 'medium',
        actionKind: 'redistribute_team',
      }),
    );
  }

  for (const item of workspace.deliverables?.deliverables ?? []) {
    if (item.review && item.review.score < LOW_DELIVERABLE_SCORE) {
      items.push(
        createItem({
          id: `score:${projectId}:${item.id}`,
          projectId,
          projectName,
          title: item.title,
          cause: `Executive Review: ${item.review.score}/100 — качество ниже порога.`,
          consequence: 'Результат нельзя использовать как финальный deliverable.',
          recommendation: 'Нажать Improve — Executive Brain улучшит версию.',
          priority: item.review.score < 60 ? 'high' : 'medium',
          actionKind: 'improve_deliverable',
        }),
      );
    }

    if (item.phase !== 'ready') {
      const completedAgent = workspace.orchestra?.queue.find(
        (agent) => agent.taskTitle === item.taskTitle && agent.status === 'completed',
      );

      if (completedAgent) {
        items.push(
          createItem({
            id: `stuck:${projectId}:${item.id}`,
            projectId,
            projectName,
            title: item.title,
            cause: `Deliverable в фазе ${item.phase}, хотя агент уже завершил задачу.`,
            consequence: 'Results не попадают в Mission Control.',
            recommendation: 'Изменить порядок работ или повторно запустить enrich.',
            priority: 'medium',
            actionKind: 'reorder_work',
          }),
        );
      }
    }
  }

  for (const briefItem of view.brief) {
    if (briefItem.tone === 'risk') {
      items.push(
        createItem({
          id: `risk:${projectId}:${briefItem.text}`,
          projectId,
          projectName,
          title: projectName,
          cause: briefItem.text,
          consequence: 'Navigator и Orchestra могут расходиться с планом CEO.',
          recommendation: 'Утвердить Navigator или запросить решение пользователя.',
          priority: 'medium',
          actionKind: 'request_decision',
        }),
      );
    }

    if (briefItem.tone === 'waiting' && executive?.goal === 'design') {
      items.push(
        createItem({
          id: `waiting:${projectId}`,
          projectId,
          projectName,
          title: 'Developer ждёт решение',
          cause: briefItem.text,
          consequence: 'Design-цикл блокирует реализацию и deliverables.',
          recommendation: 'Запросить решение пользователя в Workspace.',
          priority: 'high',
          actionKind: 'request_decision',
        }),
      );
    }
  }

  items.push(...scanPromptFailures(projectId, projectName));

  return items;
}

export function buildExecutiveAttentionItems(input: BuildExecutiveAttentionInput): ExecutiveAttentionItem[] {
  const now = input.now ?? new Date();
  const items: ExecutiveAttentionItem[] = [
    ...scanStaleProjects(input.snapshot, now),
    ...scanFailedRuns(input.snapshot),
    ...scanHealth(input.snapshot),
    ...scanConciergeWarnings(input.concierge),
  ];

  if (input.workspace) {
    items.push(...scanWorkspaceAttention(input.workspace, input.scope));
  } else {
    items.push(...scanPromptFailures(null, null));
  }

  return sortItems(dedupeItems(items)).slice(0, 8);
}

export function buildExecutiveAttentionSnapshot(
  input: BuildExecutiveAttentionInput,
): ExecutiveAttentionSnapshot {
  const now = input.now ?? new Date();

  return {
    items: buildExecutiveAttentionItems(input),
    scannedAt: now.toISOString(),
  };
}
