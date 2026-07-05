import { aiGateway } from '@/services/runtime/gateway/ai-gateway';
import { loadProjectDeliverables, saveProjectDeliverables } from '@/lib/storage/deliverables-storage';
import { getRuntimeStorage } from '@/lib/storage/storage-factory';
import type { GatewayRequest } from '@/types/runtime/dto';
import type { ProjectDeliverable } from '@/types/deliverables';

import {
  buildDeliverableFallbackContent,
  buildDeliverableGatewayPrompt,
} from './deliverable-content';
import { buildExecutiveReview } from './executive-review';
import { createInitialDeliverableVersion } from './improve-deliverable';

function applyEnrichedContent(
  deliverable: ProjectDeliverable,
  content: string,
  summary: string,
): ProjectDeliverable {
  const versions =
    deliverable.versions.length > 0
      ? deliverable.versions.map((version, index) =>
          index === 0 ? { ...version, content, summary } : version,
        )
      : createInitialDeliverableVersion({ content, summary });

  const next: ProjectDeliverable = {
    ...deliverable,
    summary,
    content,
    versions,
    currentVersion: deliverable.currentVersion || 1,
    updatedAt: new Date().toISOString(),
  };

  next.review = buildExecutiveReview(next);

  return next;
}

export async function enrichDeliverableWithGateway(input: {
  deliverable: ProjectDeliverable;
  projectId: string;
  projectName: string;
  projectDescription: string;
  organizationId: string;
  userId: string;
}): Promise<ProjectDeliverable> {
  const fallback = buildDeliverableFallbackContent({
    type: input.deliverable.type,
    projectName: input.projectName,
    projectDescription: input.projectDescription,
    agentRole: input.deliverable.agentRole,
    taskTitle: input.deliverable.taskTitle,
  });

  try {
    const request: GatewayRequest = {
      scope: {
        organizationId: input.organizationId,
        userId: input.userId,
        projectId: input.projectId,
      },
      trace: {
        runId: crypto.randomUUID(),
        traceId: crypto.randomUUID(),
        correlationId: crypto.randomUUID(),
      },
      providerCode: 'auto',
      modelCode: 'auto',
      messages: [
        {
          role: 'user',
          content: buildDeliverableGatewayPrompt({
            type: input.deliverable.type,
            projectName: input.projectName,
            projectDescription: input.projectDescription,
            agentRole: input.deliverable.agentRole,
            taskTitle: input.deliverable.taskTitle,
          }),
        },
      ],
      tools: [],
      parameters: {
        temperature: 0.35,
        maxTokens: 1024,
      },
      timeoutMs: 45_000,
      retryPolicy: {
        maxAttempts: 2,
        backoffMs: [500, 1500],
      },
    };

    const response = await aiGateway.complete(request);
    const content = response.content?.trim();

    if (!content) {
      return applyEnrichedContent(input.deliverable, fallback.content, fallback.summary);
    }

    const summaryLine = content.split('\n').find((line) => line.trim().length > 0) ?? fallback.summary;
    const summary = summaryLine.replace(/^#+\s*/, '').slice(0, 160);

    return applyEnrichedContent(input.deliverable, content, summary);
  } catch {
    return applyEnrichedContent(input.deliverable, fallback.content, fallback.summary);
  }
}

export async function enrichLatestReadyDeliverable(input: {
  projectId: string;
  projectName: string;
  projectDescription: string;
  organizationId: string;
  userId: string;
}): Promise<void> {
  const storage = getRuntimeStorage();
  const pkg = loadProjectDeliverables(storage, input.projectId);

  if (!pkg) {
    return;
  }

  const latestReadyIndex = pkg.deliverables.findLastIndex((item) => item.phase === 'ready');

  if (latestReadyIndex < 0) {
    return;
  }

  const current = pkg.deliverables[latestReadyIndex]!;

  const enriched = await enrichDeliverableWithGateway({
    deliverable: current,
    projectId: input.projectId,
    projectName: input.projectName,
    projectDescription: input.projectDescription,
    organizationId: input.organizationId,
    userId: input.userId,
  });

  const deliverables = [...pkg.deliverables];
  deliverables[latestReadyIndex] = enriched;

  saveProjectDeliverables(storage, {
    ...pkg,
    deliverables,
    updatedAt: new Date().toISOString(),
  });
}
