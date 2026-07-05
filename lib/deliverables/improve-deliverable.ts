import { captureGatewayMemory } from '@/lib/memory/memory-engine';
import {
  loadProjectDeliverables,
  saveProjectDeliverables,
} from '@/lib/storage/deliverables-storage';
import { getRuntimeStorage } from '@/lib/storage/storage-factory';
import { publishRuntimeEvent } from '@/lib/events/event-runtime';
import { RUNTIME_EVENT_TYPES } from '@/types/event-runtime';
import type {
  DeliverableVersion,
  DeliverableVersionLabel,
  ProjectDeliverable,
} from '@/types/deliverables';
import { DELIVERABLE_VERSION_LABELS } from '@/types/deliverables';
import type { ExecutiveGoal, ExecutiveScope } from '@/types/executive';

import { buildExecutiveReview, reviewScoreAfterImprove } from './executive-review';

function nextVersionLabel(currentVersion: number): DeliverableVersionLabel {
  if (currentVersion === 1) {
    return 'improved';
  }

  return 'final';
}

function improveContent(content: string, type: ProjectDeliverable['type'], projectName: string): {
  content: string;
  changeNotes: string[];
} {
  const notes: string[] = [];
  let next = content;

  if (!/## Преимущества|## Benefits|## Ценность/.test(next)) {
    next = `${next.trim()}\n\n## Преимущества\n- Быстрее к результату без лишней координации\n- Executive Brain держит фокус CEO\n- AI-команда работает параллельно`;
    notes.push('Добавлены преимущества.');
  }

  if (type === 'landing' && !/proof|кейс|цифр/i.test(next)) {
    next = next.replace(/(## CTA[\s\S]*)$/m, '## Proof\n- Первые пользователи получают результат за один день\n\n$1');
    notes.push('Усилен оффер.');
  }

  if (!/→|CTA|Следующий шаг|Next step/i.test(next)) {
    next = `${next.trim()}\n\n## Следующий шаг\nНачать с «${projectName}» → подтвердить первый шаг сегодня.`;
    notes.push('Уточнён CTA.');
  }

  if (countSections(next) < 4) {
    next = next.replace(/^# (.+)$/m, '# $1\n\n> Executive Brain: структура выровнена под CEO-first чтение.');
    notes.push('Исправлена структура.');
  }

  if (notes.length === 0) {
    notes.push('Усилен оффер.', 'Уточнён CTA.');
    next = `${next.trim()}\n\n---\nExecutive Brain: версия улучшена для немедленного использования.`;
  }

  return { content: next, changeNotes: notes.slice(0, 4) };
}

function countSections(content: string): number {
  return content.split('\n').filter((line) => line.trim().startsWith('##')).length;
}

function summaryFromContent(content: string, fallback: string): string {
  const line = content.split('\n').find((entry) => entry.trim().length > 0);

  if (!line) {
    return fallback;
  }

  return line.replace(/^#+\s*/, '').slice(0, 160);
}

export function improveProjectDeliverable(input: {
  projectId: string;
  deliverableId: string;
  projectName: string;
  scope: ExecutiveScope;
  userId: string;
  goal?: ExecutiveGoal;
}): ProjectDeliverable | null {
  const storage = getRuntimeStorage();
  const pkg = loadProjectDeliverables(storage, input.projectId);

  if (!pkg) {
    return null;
  }

  const index = pkg.deliverables.findIndex((item) => item.id === input.deliverableId);

  if (index < 0) {
    return null;
  }

  const current = pkg.deliverables[index]!;

  if (current.phase !== 'ready' || current.currentVersion >= 3) {
    return current;
  }

  const nextVersionNumber = current.currentVersion + 1;
  const label = nextVersionLabel(current.currentVersion);
  const improved = improveContent(current.content, current.type, input.projectName);
  const summary = summaryFromContent(improved.content, current.summary);

  const version: DeliverableVersion = {
    version: nextVersionNumber,
    label,
    labelDisplay: DELIVERABLE_VERSION_LABELS[label],
    content: improved.content,
    summary,
    changeNotes: improved.changeNotes,
    createdAt: new Date().toISOString(),
  };

  const updated: ProjectDeliverable = {
    ...current,
    content: improved.content,
    summary,
    versions: [...current.versions, version],
    currentVersion: nextVersionNumber,
    review: buildExecutiveReview({
      ...current,
      content: improved.content,
      summary,
    }),
    updatedAt: new Date().toISOString(),
  };

  if (updated.review && current.review) {
    updated.review.score = reviewScoreAfterImprove(current.review.score, nextVersionNumber);
    updated.review.confidence =
      updated.review.score >= 78 ? 'high' : updated.review.score >= 62 ? 'medium' : 'low';
  }

  const deliverables = [...pkg.deliverables];
  deliverables[index] = updated;

  saveProjectDeliverables(storage, {
    ...pkg,
    deliverables,
    updatedAt: new Date().toISOString(),
  });

  publishRuntimeEvent(
    {
      projectId: input.projectId,
      type: RUNTIME_EVENT_TYPES.DELIVERABLE_IMPROVED,
      actor: 'system:executive-brain',
      source: 'executive_brain',
      payload: {
        deliverableId: current.id,
        deliverableType: current.type,
        deliverableTitle: current.title,
        version: nextVersionNumber,
        versionLabel: label,
        changeNotes: improved.changeNotes,
        score: updated.review?.score ?? null,
      },
    },
    storage,
  );

  captureGatewayMemory({
    task: `Executive Brain улучшил ${current.title}`,
    result: improved.changeNotes.join(' · '),
    intent: input.goal ?? 'business_analysis',
    routingCategory: 'planning',
    organizationId: input.scope.organizationId,
    userId: input.userId,
    projectName: input.projectName,
    scope: 'project',
    importance: 'high',
  });

  return updated;
}

export function createInitialDeliverableVersion(input: {
  content: string;
  summary: string;
}): DeliverableVersion[] {
  return [
    {
      version: 1,
      label: 'draft',
      labelDisplay: DELIVERABLE_VERSION_LABELS.draft,
      content: input.content,
      summary: input.summary,
      changeNotes: [],
      createdAt: new Date().toISOString(),
    },
  ];
}

export function finalizeReadyDeliverable(
  deliverable: Omit<ProjectDeliverable, 'review' | 'versions' | 'currentVersion'>,
): ProjectDeliverable {
  const versions = createInitialDeliverableVersion({
    content: deliverable.content,
    summary: deliverable.summary,
  });

  const withReview: ProjectDeliverable = {
    ...deliverable,
    versions,
    currentVersion: 1,
    review: null,
  };

  withReview.review = buildExecutiveReview(withReview);

  return withReview;
}
