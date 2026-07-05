import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

import { resetExecutiveState } from '@/lib/executive/executive-state';
import { getLastExecutiveDecision } from '@/lib/executive/executive-engine';
import { buildExecutiveReview, confidenceLabel } from '@/lib/deliverables/executive-review';
import { runProjectLifecycle } from '@/lib/project-lifecycle/run-project-lifecycle';
import { advanceAiOrchestraForProject } from '@/lib/project-lifecycle/ai-orchestra-engine';
import { resetMemoryStore } from '@/lib/memory/memory-engine';
import { resetProjectRuntimeStore } from '@/lib/project-runtime/project-runtime-store';
import { findProjectRuntimeEvents } from '@/lib/events/event-runtime';
import { RUNTIME_EVENT_TYPES } from '@/types/event-runtime';
import {
  finalizeReadyDeliverable,
  improveProjectDeliverable,
} from '@/lib/deliverables/improve-deliverable';
import { clearDeliverablesNamespace, saveProjectDeliverables } from '@/lib/storage/deliverables-storage';
import { getRuntimeStorage } from '@/lib/storage/storage-factory';
import { loadProjectDeliverablesPackage } from '@/lib/deliverables/deliverables-engine';
import { buildExecutiveMemory } from '@/utils/workspace/executive-memory';
import { buildProjectReplay } from '@/utils/workspace/project-replay';

const scope = {
  organizationId: 'org-review',
  userId: 'user-review',
};

describe('Executive Review Layer', () => {
  beforeEach(() => {
    resetMemoryStore();
    resetProjectRuntimeStore();
    resetExecutiveState();
    clearDeliverablesNamespace(getRuntimeStorage());
  });

  it('builds executive review with score and confidence', () => {
    const deliverable = finalizeReadyDeliverable({
      id: 'del-1',
      type: 'landing',
      title: 'Landing',
      agentId: 'marketing',
      agentRole: 'Marketing Director',
      taskTitle: 'Подготовить landing',
      phase: 'ready',
      summary: 'Landing page для OSA Product',
      content: '# OSA Product\n\n## Hero\nTest\n\n## CTA\nStart →',
      updatedAt: new Date().toISOString(),
    });

    assert.ok(deliverable.review);
    assert.ok(deliverable.review.score >= 0 && deliverable.review.score <= 100);
    assert.ok(['low', 'medium', 'high'].includes(deliverable.review.confidence));
    assert.equal(deliverable.review.strengths.length, 3);
    assert.equal(deliverable.review.weaknesses.length, 2);
    assert.equal(deliverable.review.recommendations.length, 2);
    assert.ok(deliverable.review.nextAction.length > 0);
    assert.equal(confidenceLabel(deliverable.review.confidence).length > 0, true);
  });

  it('reviews deliverables automatically when orchestra completes an agent', () => {
    runProjectLifecycle({
      projectId: 'project-review-1',
      name: 'OSA Product',
      description: 'Investor demo',
      declaredType: 'marketing',
      organizationId: scope.organizationId,
      userId: scope.userId,
    });

    advanceAiOrchestraForProject('project-review-1', scope, {
      organizationId: scope.organizationId,
      userId: scope.userId,
      projectName: 'OSA Product',
      goal: 'create_content',
    });

    const pkg = loadProjectDeliverablesPackage('project-review-1');
    const ready = pkg?.deliverables.find((item) => item.phase === 'ready');

    assert.ok(ready?.review);
    assert.equal(ready.versions.length, 1);
    assert.equal(ready.versions[0]?.labelDisplay, 'Draft');

    const events = findProjectRuntimeEvents('project-review-1', getRuntimeStorage());
    assert.ok(events.some((event) => event.type === RUNTIME_EVENT_TYPES.DELIVERABLE_REVIEW_COMPLETED));
  });

  it('improves deliverable without creating a new deliverable type', () => {
    runProjectLifecycle({
      projectId: 'project-review-2',
      name: 'Landing Page',
      description: 'Launch',
      declaredType: 'marketing',
      organizationId: scope.organizationId,
      userId: scope.userId,
    });

    advanceAiOrchestraForProject('project-review-2', scope, {
      organizationId: scope.organizationId,
      userId: scope.userId,
      projectName: 'Landing Page',
      goal: 'create_content',
    });

    const pkg = loadProjectDeliverablesPackage('project-review-2');
    const ready = pkg?.deliverables.find((item) => item.phase === 'ready');

    assert.ok(ready);

    const improved = improveProjectDeliverable({
      projectId: 'project-review-2',
      deliverableId: ready.id,
      projectName: 'Landing Page',
      scope,
      userId: scope.userId,
      goal: 'create_content',
    });

    assert.ok(improved);
    assert.equal(improved.id, ready.id);
    assert.equal(improved.currentVersion, 2);
    assert.equal(improved.versions.length, 2);
    assert.equal(improved.versions[1]?.labelDisplay, 'Improved by Executive Brain');
    assert.ok(improved.versions[1]?.changeNotes.length > 0);
    assert.ok((improved.review?.score ?? 0) >= (ready.review?.score ?? 0));

    const events = findProjectRuntimeEvents('project-review-2', getRuntimeStorage());
    assert.ok(events.some((event) => event.type === RUNTIME_EVENT_TYPES.DELIVERABLE_IMPROVED));

    const memory = buildExecutiveMemory(events, {
      header: {
        title: 'Landing Page',
        description: 'Launch',
        status: 'В работе',
        lastActivity: null,
      },
      today: {
        headline: 'Today',
        mission: 'Mission',
        nextStep: 'Next',
        priority: 'priority',
        progressPercent: 50,
        lastResult: null,
      },
      lifecycle: null,
      orchestra: null,
      executiveSummary: getLastExecutiveDecision(scope)?.summary ?? null,
    });

    assert.ok(memory.entries.some((entry) => entry.title.includes('Executive Brain улучшил')));

    const replay = buildProjectReplay(events, 'Landing Page');
    assert.ok(replay.scenes.some((scene) => scene.description.includes('улучшен')));
  });

  it('creates final version on second improve', () => {
    const deliverable = finalizeReadyDeliverable({
      id: 'del-final',
      type: 'business_strategy',
      title: 'Business Strategy',
      agentId: 'business-manager',
      agentRole: 'Business Manager',
      taskTitle: 'Стратегия',
      phase: 'ready',
      summary: 'Strategy',
      content: '# Strategy\n\n## Focus\nGrow\n\n## CTA\nGo →',
      updatedAt: new Date().toISOString(),
    });

    const storage = getRuntimeStorage();

    saveProjectDeliverables(storage, {
      projectId: 'project-review-3',
      projectName: 'Strategy Project',
      deliverables: [deliverable],
      packageStatus: 'in_progress',
      executiveSummary: null,
      assembledAt: null,
      updatedAt: new Date().toISOString(),
    });

    improveProjectDeliverable({
      projectId: 'project-review-3',
      deliverableId: 'del-final',
      projectName: 'Strategy Project',
      scope,
      userId: scope.userId,
    });

    const finalVersion = improveProjectDeliverable({
      projectId: 'project-review-3',
      deliverableId: 'del-final',
      projectName: 'Strategy Project',
      scope,
      userId: scope.userId,
    });

    assert.ok(finalVersion);
    assert.equal(finalVersion.currentVersion, 3);
    assert.equal(finalVersion.versions[2]?.labelDisplay, 'Final');
  });
});
