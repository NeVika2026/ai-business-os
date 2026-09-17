import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { FactoryArtifact } from '@/lib/factory-chain/persistence';
import { buildProjectFactoryCenter } from '@/utils/projects/project-factory-center';

function artifact(
  id: string,
  stage: FactoryArtifact['stage'],
  createdAt: string,
): FactoryArtifact {
  return {
    id,
    projectId: 'project-1',
    stage,
    title: `Результат ${stage}`,
    content: `Контент ${stage}`,
    sources: [],
    metadata: {},
    createdAt,
  };
}

describe('project factory control center', () => {
  it('starts a new project from the Find stage', () => {
    const center = buildProjectFactoryCenter({
      projectId: 'project-1',
      artifacts: [],
      mediaCount: 0,
    });

    assert.equal(center.progressPercent, 0);
    assert.equal(center.currentStage, 'find');
    assert.equal(center.continueLabel, 'Начать с поиска →');
    assert.equal(center.continueHref, '/modules/find/studio?project=project-1');
    assert.equal(center.completedStageCount, 0);
  });

  it('continues from the latest saved stage and keeps the exact artifact', () => {
    const artifacts = [
      artifact('analysis-2', 'analyze', '2026-09-17T17:00:00.000Z'),
      artifact('find-1', 'find', '2026-09-17T16:00:00.000Z'),
    ];

    const center = buildProjectFactoryCenter({
      projectId: 'project-1',
      artifacts,
      mediaCount: 2,
    });

    assert.equal(center.progressPercent, 50);
    assert.equal(center.currentStage, 'analyze');
    assert.equal(center.nextStage, 'create');
    assert.equal(center.continueLabel, 'Продолжить в создании →');
    assert.equal(
      center.continueHref,
      '/modules/create/studio?project=project-1&artifact=analysis-2&mode=document',
    );
    assert.equal(center.latestArtifact?.id, 'analysis-2');
    assert.equal(center.mediaCount, 2);
  });

  it('marks a published chain as complete and counts publication outputs', () => {
    const artifacts = [
      artifact('publish-2', 'publish', '2026-09-17T19:00:00.000Z'),
      artifact('publish-1', 'publish', '2026-09-17T18:30:00.000Z'),
      artifact('create-1', 'create', '2026-09-17T18:00:00.000Z'),
      artifact('analyze-1', 'analyze', '2026-09-17T17:00:00.000Z'),
      artifact('find-1', 'find', '2026-09-17T16:00:00.000Z'),
    ];

    const center = buildProjectFactoryCenter({
      projectId: 'project-1',
      artifacts,
      mediaCount: 1,
    });

    assert.equal(center.progressPercent, 100);
    assert.equal(center.currentStage, 'publish');
    assert.equal(center.nextStage, null);
    assert.equal(center.publicationCount, 2);
    assert.equal(center.completedStageCount, 4);
    assert.equal(center.continueLabel, 'Открыть публикацию →');
  });

  it('keeps only the newest artifact for each stage in the stage summary', () => {
    const artifacts = [
      artifact('create-new', 'create', '2026-09-17T18:00:00.000Z'),
      artifact('create-old', 'create', '2026-09-17T17:30:00.000Z'),
      artifact('find-1', 'find', '2026-09-17T16:00:00.000Z'),
    ];

    const center = buildProjectFactoryCenter({
      projectId: 'project-1',
      artifacts,
      mediaCount: 0,
    });

    assert.equal(center.stageStates.create.latestArtifact?.id, 'create-new');
    assert.equal(center.stageStates.analyze.latestArtifact, null);
  });
});
