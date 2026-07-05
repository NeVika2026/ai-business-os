import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

import { resetExecutiveState } from '@/lib/executive/executive-state';
import { getLastExecutiveDecision } from '@/lib/executive/executive-engine';
import {
  assignDeliverableType,
  deliverablePhaseLabel,
  DELIVERABLE_TYPE_LABELS,
} from '@/lib/deliverables/deliverable-catalog';
import { buildDeliverableFallbackContent } from '@/lib/deliverables/deliverable-content';
import { loadProjectDeliverablesPackage } from '@/lib/deliverables/deliverables-engine';
import { clearDeliverablesNamespace } from '@/lib/storage/deliverables-storage';
import {
  advanceAiOrchestraForProject,
} from '@/lib/project-lifecycle/ai-orchestra-engine';
import { runProjectLifecycle } from '@/lib/project-lifecycle/run-project-lifecycle';
import { resetMemoryStore } from '@/lib/memory/memory-engine';
import { resetProjectRuntimeStore } from '@/lib/project-runtime/project-runtime-store';
import { findProjectRuntimeEvents } from '@/lib/events/event-runtime';
import { RUNTIME_EVENT_TYPES } from '@/types/event-runtime';
import { getRuntimeStorage } from '@/lib/storage/storage-factory';

const scope = {
  organizationId: 'org-deliverables',
  userId: 'user-deliverables',
};

describe('Deliverables Engine', () => {
  beforeEach(() => {
    resetMemoryStore();
    resetProjectRuntimeStore();
    resetExecutiveState();
    clearDeliverablesNamespace(getRuntimeStorage());
  });

  it('assigns unique deliverable types to orchestra agents', () => {
    const used = new Set<ReturnType<typeof assignDeliverableType>>();

    assert.equal(assignDeliverableType('business-manager', used), 'business_strategy');
    assert.equal(assignDeliverableType('marketing', used), 'marketing_plan');
    assert.equal(assignDeliverableType('content', used), 'content_plan');
    assert.equal(used.size, 3);
  });

  it('labels deliverable phases for workspace progress', () => {
    assert.equal(deliverablePhaseLabel('thinking'), 'Thinking…');
    assert.equal(deliverablePhaseLabel('draft'), 'Draft…');
    assert.equal(deliverablePhaseLabel('ready'), 'Ready');
  });

  it('builds fallback deliverables with usable content', () => {
    const generated = buildDeliverableFallbackContent({
      type: 'marketing_plan',
      projectName: 'OSA Product',
      projectDescription: 'Investor demo',
      agentRole: 'Marketing Director',
      taskTitle: 'Подготовить go-to-market',
    });

    assert.match(generated.summary, /Marketing Plan/i);
    assert.match(generated.content, /OSA Product/);
    assert.match(generated.content, /## /);
  });

  it('initializes deliverables when project lifecycle starts', () => {
    runProjectLifecycle({
      projectId: 'project-deliverables-1',
      name: 'OSA Product',
      description: 'Investor demo launch',
      declaredType: 'marketing',
      organizationId: scope.organizationId,
      userId: scope.userId,
    });

    const pkg = loadProjectDeliverablesPackage('project-deliverables-1');

    assert.ok(pkg);
    assert.equal(pkg.packageStatus, 'in_progress');
    assert.ok(pkg.deliverables.length >= 3);
    assert.ok(pkg.deliverables.some((item) => item.phase === 'draft'));
    assert.equal(pkg.deliverables.filter((item) => item.phase === 'ready').length, 0);
  });

  it('advances deliverables as orchestra completes agents', () => {
    runProjectLifecycle({
      projectId: 'project-deliverables-2',
      name: 'Landing Page',
      description: 'Launch landing',
      declaredType: 'marketing',
      organizationId: scope.organizationId,
      userId: scope.userId,
    });

    advanceAiOrchestraForProject('project-deliverables-2', scope, {
      organizationId: scope.organizationId,
      userId: scope.userId,
      projectName: 'Landing Page',
      goal: 'create_content',
    });

    const pkg = loadProjectDeliverablesPackage('project-deliverables-2');

    assert.ok(pkg);
    assert.equal(pkg.deliverables.filter((item) => item.phase === 'ready').length >= 1, true);
    assert.ok(pkg.deliverables.some((item) => item.phase === 'draft'));

    const ready = pkg.deliverables.find((item) => item.phase === 'ready');
    assert.ok(ready);
    assert.equal(ready.title, DELIVERABLE_TYPE_LABELS[ready.type]);
    assert.ok(ready.content.length > 0);
  });

  it('assembles executive package when all deliverables are ready', () => {
    runProjectLifecycle({
      projectId: 'project-deliverables-3',
      name: 'CRM Sprint',
      description: 'CRM and sales',
      declaredType: 'crm',
      organizationId: scope.organizationId,
      userId: scope.userId,
    });

    let safety = 0;

    while (safety < 12) {
      safety += 1;

      const orchestra = advanceAiOrchestraForProject('project-deliverables-3', scope, {
        organizationId: scope.organizationId,
        userId: scope.userId,
        projectName: 'CRM Sprint',
        goal: 'find_clients',
        unblock: true,
      });

      if (!orchestra) {
        break;
      }

      if (orchestra.queue.every((agent) => agent.status === 'completed')) {
        break;
      }
    }

    const pkg = loadProjectDeliverablesPackage('project-deliverables-3');

    assert.ok(pkg);
    assert.equal(pkg.packageStatus, 'ready');
    assert.ok(pkg.executiveSummary);
    assert.ok(pkg.assembledAt);
    assert.equal(pkg.deliverables.every((item) => item.phase === 'ready'), true);

    const executive = getLastExecutiveDecision(scope);
    assert.ok(executive?.reasoning.some((entry) => entry.startsWith('deliverables=')));

    const events = findProjectRuntimeEvents('project-deliverables-3', getRuntimeStorage());
    assert.ok(
      events.some((event) => event.type === RUNTIME_EVENT_TYPES.DELIVERABLES_PACKAGE_ASSEMBLED),
    );
  });
});
