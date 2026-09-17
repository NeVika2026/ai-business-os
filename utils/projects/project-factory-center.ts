import type {
  FactoryArtifact,
  FactoryStage,
} from '@/lib/factory-chain/persistence';

export const PROJECT_FACTORY_STAGE_ORDER: FactoryStage[] = [
  'find',
  'analyze',
  'create',
  'publish',
];

export const PROJECT_FACTORY_STAGE_LABELS: Record<FactoryStage, string> = {
  find: 'Найти',
  analyze: 'Анализ',
  create: 'Создать',
  publish: 'Опубликовать',
};

export type ProjectFactoryStageState = {
  stage: FactoryStage;
  label: string;
  status: 'done' | 'current' | 'pending';
  latestArtifact: FactoryArtifact | null;
};

export type ProjectFactoryCenter = {
  projectId: string;
  currentStage: FactoryStage;
  nextStage: FactoryStage | null;
  progressPercent: number;
  completedStageCount: number;
  artifactCount: number;
  mediaCount: number;
  publicationCount: number;
  latestArtifact: FactoryArtifact | null;
  continueHref: string;
  continueLabel: string;
  stageStates: Record<FactoryStage, ProjectFactoryStageState>;
};

function newestArtifactsByStage(
  artifacts: FactoryArtifact[],
): Record<FactoryStage, FactoryArtifact | null> {
  const result: Record<FactoryStage, FactoryArtifact | null> = {
    find: null,
    analyze: null,
    create: null,
    publish: null,
  };

  for (const artifact of artifacts) {
    const existing = result[artifact.stage];
    if (!existing || artifact.createdAt > existing.createdAt) {
      result[artifact.stage] = artifact;
    }
  }

  return result;
}

function buildContinueTarget(
  projectId: string,
  artifact: FactoryArtifact | null,
): { href: string; label: string; nextStage: FactoryStage | null } {
  if (!artifact) {
    return {
      href: '/modules/find/studio?project=' + encodeURIComponent(projectId),
      label: 'Начать с поиска →',
      nextStage: 'find',
    };
  }

  const params = new URLSearchParams({
    project: projectId,
    artifact: artifact.id,
  });

  if (artifact.stage === 'find') {
    return {
      href: '/modules/analyze/studio?' + params.toString(),
      label: 'Продолжить в анализе →',
      nextStage: 'analyze',
    };
  }

  if (artifact.stage === 'analyze') {
    params.set('mode', 'document');
    return {
      href: '/modules/create/studio?' + params.toString(),
      label: 'Продолжить в создании →',
      nextStage: 'create',
    };
  }

  if (artifact.stage === 'create') {
    return {
      href: '/modules/publish/studio?' + params.toString(),
      label: 'Продолжить в публикации →',
      nextStage: 'publish',
    };
  }

  return {
    href: '/modules/publish/studio?' + params.toString(),
    label: 'Открыть публикацию →',
    nextStage: null,
  };
}

export function buildProjectFactoryCenter(input: {
  projectId: string;
  artifacts: FactoryArtifact[];
  mediaCount: number;
}): ProjectFactoryCenter {
  const artifacts = [...input.artifacts].sort((left, right) =>
    right.createdAt.localeCompare(left.createdAt),
  );
  const newestByStage = newestArtifactsByStage(artifacts);
  const completedStageCount = PROJECT_FACTORY_STAGE_ORDER.filter(
    (stage) => Boolean(newestByStage[stage]),
  ).length;
  const latestArtifact = artifacts[0] ?? null;
  const currentStage = latestArtifact?.stage ?? 'find';
  const continueTarget = buildContinueTarget(input.projectId, latestArtifact);

  const stageStates = Object.fromEntries(
    PROJECT_FACTORY_STAGE_ORDER.map((stage) => {
      const hasArtifact = Boolean(newestByStage[stage]);
      let status: ProjectFactoryStageState['status'] = hasArtifact ? 'done' : 'pending';

      if (!latestArtifact && stage === 'find') {
        status = 'current';
      } else if (continueTarget.nextStage === stage) {
        status = 'current';
      }

      return [
        stage,
        {
          stage,
          label: PROJECT_FACTORY_STAGE_LABELS[stage],
          status,
          latestArtifact: newestByStage[stage],
        } satisfies ProjectFactoryStageState,
      ];
    }),
  ) as Record<FactoryStage, ProjectFactoryStageState>;

  return {
    projectId: input.projectId,
    currentStage,
    nextStage: continueTarget.nextStage,
    progressPercent: Math.round(
      (completedStageCount / PROJECT_FACTORY_STAGE_ORDER.length) * 100,
    ),
    completedStageCount,
    artifactCount: artifacts.length,
    mediaCount: input.mediaCount,
    publicationCount: artifacts.filter((artifact) => artifact.stage === 'publish').length,
    latestArtifact,
    continueHref: continueTarget.href,
    continueLabel: continueTarget.label,
    stageStates,
  };
}
