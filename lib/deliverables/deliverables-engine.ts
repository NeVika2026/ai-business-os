import { getLastExecutiveDecision } from '@/lib/executive/executive-engine';
import { writeExecutiveDecision } from '@/lib/executive/executive-state';
import { captureGatewayMemory } from '@/lib/memory/memory-engine';
import {
  loadProjectDeliverables,
  saveProjectDeliverables,
} from '@/lib/storage/deliverables-storage';
import { getRuntimeStorage } from '@/lib/storage/storage-factory';
import { publishRuntimeEvent } from '@/lib/events/event-runtime';
import { RUNTIME_EVENT_TYPES } from '@/types/event-runtime';
import type {
  DeliverablePhase,
  ProjectDeliverable,
  ProjectDeliverablesPackage,
} from '@/types/deliverables';
import type { OrchestraAgent } from '@/types/ai-orchestra';
import type { ExecutiveGoal, ExecutiveScope } from '@/types/executive';

import {
  assignDeliverableType,
  DELIVERABLE_TYPE_LABELS,
} from './deliverable-catalog';
import {
  buildDeliverableFallbackContent,
  type DeliverableGenerationInput,
} from './deliverable-content';
import { finalizeReadyDeliverable } from './improve-deliverable';

function orchestraPhaseToDeliverable(status: OrchestraAgent['status']): DeliverablePhase {
  switch (status) {
    case 'waiting':
      return 'thinking';
    case 'working':
    case 'blocked':
      return 'draft';
    case 'completed':
      return 'ready';
  }
}

function buildDeliverableRecord(
  agent: OrchestraAgent,
  type: ReturnType<typeof assignDeliverableType>,
  projectName: string,
  projectDescription: string,
): ProjectDeliverable {
  const phase = orchestraPhaseToDeliverable(agent.status);
  const input: DeliverableGenerationInput = {
    type,
    projectName,
    projectDescription,
    agentRole: agent.role,
    taskTitle: agent.taskTitle,
  };

  if (phase === 'ready') {
    const generated = buildDeliverableFallbackContent(input);

    return finalizeReadyDeliverable({
      id: agent.id,
      type,
      title: DELIVERABLE_TYPE_LABELS[type],
      agentId: agent.agentId,
      agentRole: agent.role,
      taskTitle: agent.taskTitle,
      phase: 'ready',
      summary: generated.summary,
      content: generated.content,
      updatedAt: new Date().toISOString(),
    });
  }

  return {
    id: agent.id,
    type,
    title: DELIVERABLE_TYPE_LABELS[type],
    agentId: agent.agentId,
    agentRole: agent.role,
    taskTitle: agent.taskTitle,
    phase,
    summary: phase === 'draft' ? `${agent.role} готовит ${DELIVERABLE_TYPE_LABELS[type]}` : '',
    content: '',
    review: null,
    versions: [],
    currentVersion: 0,
    updatedAt: new Date().toISOString(),
  };
}

function publishDeliverableReviewEvent(
  storage: ReturnType<typeof getRuntimeStorage>,
  projectId: string,
  deliverable: ProjectDeliverable,
): void {
  if (!deliverable.review) {
    return;
  }

  publishRuntimeEvent(
    {
      projectId,
      type: RUNTIME_EVENT_TYPES.DELIVERABLE_REVIEW_COMPLETED,
      actor: 'system:executive-brain',
      source: 'executive_brain',
      payload: {
        deliverableId: deliverable.id,
        deliverableType: deliverable.type,
        deliverableTitle: deliverable.title,
        score: deliverable.review.score,
        confidence: deliverable.review.confidence,
        nextAction: deliverable.review.nextAction,
      },
    },
    storage,
  );
}

export function initializeProjectDeliverables(input: {
  projectId: string;
  projectName: string;
  projectDescription: string;
  queue: OrchestraAgent[];
}): ProjectDeliverablesPackage {
  const usedTypes = new Set<ReturnType<typeof assignDeliverableType>>();
  const deliverables = input.queue.map((agent) => {
    const type = assignDeliverableType(agent.agentId, usedTypes);

    return buildDeliverableRecord(agent, type, input.projectName, input.projectDescription);
  });

  const pkg: ProjectDeliverablesPackage = {
    projectId: input.projectId,
    projectName: input.projectName,
    deliverables,
    packageStatus: 'in_progress',
    executiveSummary: null,
    assembledAt: null,
    updatedAt: new Date().toISOString(),
  };

  saveProjectDeliverables(getRuntimeStorage(), pkg);

  return pkg;
}

export function syncDeliverablesWithOrchestra(input: {
  projectId: string;
  projectName: string;
  projectDescription: string;
  queue: OrchestraAgent[];
  scope?: ExecutiveScope;
  goal?: ExecutiveGoal;
  userId?: string;
}): ProjectDeliverablesPackage {
  const storage = getRuntimeStorage();
  const existing = loadProjectDeliverables(storage, input.projectId);
  const usedTypes = new Set<ReturnType<typeof assignDeliverableType>>();
  const previousById = new Map(
    (existing?.deliverables ?? []).map((deliverable) => [deliverable.id, deliverable]),
  );

  const deliverables: ProjectDeliverable[] = input.queue.map((agent) => {
    const type = assignDeliverableType(agent.agentId, usedTypes);
    const previous = previousById.get(agent.id);
    const nextPhase = orchestraPhaseToDeliverable(agent.status);

    if (previous?.phase === 'ready' && nextPhase === 'ready') {
      return previous;
    }

    if (nextPhase === 'ready') {
      const generated = buildDeliverableFallbackContent({
        type,
        projectName: input.projectName,
        projectDescription: input.projectDescription,
        agentRole: agent.role,
        taskTitle: agent.taskTitle,
      });

      publishRuntimeEvent(
        {
          projectId: input.projectId,
          type: RUNTIME_EVENT_TYPES.DELIVERABLE_READY,
          actor: `agent:${agent.agentId}`,
          source: 'ai_orchestra',
          payload: {
            deliverableType: type,
            deliverableTitle: DELIVERABLE_TYPE_LABELS[type],
            agentRole: agent.role,
          },
        },
        storage,
      );

      const ready = finalizeReadyDeliverable({
        id: agent.id,
        type,
        title: DELIVERABLE_TYPE_LABELS[type],
        agentId: agent.agentId,
        agentRole: agent.role,
        taskTitle: agent.taskTitle,
        phase: 'ready',
        summary: generated.summary,
        content: generated.content,
        updatedAt: new Date().toISOString(),
      });

      publishDeliverableReviewEvent(storage, input.projectId, ready);

      return ready;
    }

    if (nextPhase === 'draft' && previous?.phase === 'thinking') {
      publishRuntimeEvent(
        {
          projectId: input.projectId,
          type: RUNTIME_EVENT_TYPES.DELIVERABLE_DRAFT_STARTED,
          actor: `agent:${agent.agentId}`,
          source: 'ai_orchestra',
          payload: {
            deliverableType: type,
            agentRole: agent.role,
          },
        },
        storage,
      );
    }

    return {
      id: agent.id,
      type,
      title: DELIVERABLE_TYPE_LABELS[type],
      agentId: agent.agentId,
      agentRole: agent.role,
      taskTitle: agent.taskTitle,
      phase: nextPhase,
      summary:
        nextPhase === 'draft'
          ? `${agent.role} готовит ${DELIVERABLE_TYPE_LABELS[type]}`
          : (previous?.summary ?? ''),
      content: previous?.content ?? '',
      review: previous?.review ?? null,
      versions: previous?.versions ?? [],
      currentVersion: previous?.currentVersion ?? 0,
      updatedAt: new Date().toISOString(),
    };
  });

  const allReady = deliverables.length > 0 && deliverables.every((item) => item.phase === 'ready');
  let executiveSummary = existing?.executiveSummary ?? null;
  let assembledAt = existing?.assembledAt ?? null;
  let packageStatus: ProjectDeliverablesPackage['packageStatus'] = allReady ? 'ready' : 'in_progress';

  if (allReady && !assembledAt && input.scope) {
    const assembly = assembleExecutiveDeliverablesPackage({
      projectName: input.projectName,
      deliverables,
      scope: input.scope,
      goal: input.goal,
      userId: input.userId,
      projectId: input.projectId,
    });

    executiveSummary = assembly.executiveSummary;
    assembledAt = assembly.assembledAt;
    packageStatus = 'ready';
  }

  const pkg: ProjectDeliverablesPackage = {
    projectId: input.projectId,
    projectName: input.projectName,
    deliverables,
    packageStatus,
    executiveSummary,
    assembledAt,
    updatedAt: new Date().toISOString(),
  };

  saveProjectDeliverables(storage, pkg);

  return pkg;
}

function assembleExecutiveDeliverablesPackage(input: {
  projectId: string;
  projectName: string;
  deliverables: ProjectDeliverable[];
  scope: ExecutiveScope;
  goal?: ExecutiveGoal;
  userId?: string;
}): { executiveSummary: string; assembledAt: string } {
  const storage = getRuntimeStorage();
  const titles = input.deliverables.map((item) => item.title).join(', ');
  const executiveSummary = `Executive Brain собрал пакет для «${input.projectName}»: ${titles}.`;

  publishRuntimeEvent(
    {
      projectId: input.projectId,
      type: RUNTIME_EVENT_TYPES.DELIVERABLES_PACKAGE_ASSEMBLED,
      actor: 'system:executive-brain',
      source: 'executive_brain',
      payload: {
        deliverableCount: input.deliverables.length,
        deliverableTypes: input.deliverables.map((item) => item.type),
        executiveSummary,
      },
    },
    storage,
  );

  const executive = getLastExecutiveDecision(input.scope);

  if (executive) {
    writeExecutiveDecision(
      input.scope,
      {
        ...executive,
        summary: executiveSummary,
        navigatorMode: 'next_step',
        reasoning: [
          ...executive.reasoning.filter((entry) => !entry.startsWith('deliverables=')),
          `deliverables=${input.deliverables.length}`,
          `package=ready`,
        ],
      },
      storage,
    );
  }

  if (input.userId) {
    captureGatewayMemory({
      task: `Deliverables готовы для «${input.projectName}»`,
      result: input.deliverables.map((item) => `${item.title}: ${item.summary}`).join(' · '),
      intent: input.goal ?? 'business_analysis',
      routingCategory: 'planning',
      organizationId: input.scope.organizationId,
      userId: input.userId,
      projectName: input.projectName,
      scope: 'project',
      importance: 'high',
    });
  }

  return {
    executiveSummary,
    assembledAt: new Date().toISOString(),
  };
}

export function loadProjectDeliverablesPackage(projectId: string): ProjectDeliverablesPackage | null {
  return loadProjectDeliverables(getRuntimeStorage(), projectId);
}

export function hasResultsReady(pkg: ProjectDeliverablesPackage | null): boolean {
  if (!pkg) {
    return false;
  }

  return pkg.deliverables.some((item) => item.phase === 'ready');
}

export { improveProjectDeliverable } from './improve-deliverable';
