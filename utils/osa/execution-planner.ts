import type { OsaAgentDefinition, OsaAgentId } from '@/utils/osa/agent-registry';
import { resolveOsaAgentRefs } from '@/utils/osa/agent-registry';
import type { NavigatorRecommendation } from '@/utils/osa/navigator-engine';
import { matchesAnyOsaPattern, normalizeOsaText } from '@/utils/osa/text-matching';

export type ExecutionStageStatus = 'pending' | 'ready' | 'running' | 'completed';

export type ExecutionMode = 'sequential' | 'hybrid' | 'parallel';

export type ExecutionRiskSeverity = 'low' | 'medium' | 'high';

export type ExecutionRisk = {
  id: string;
  severity: ExecutionRiskSeverity;
  title: string;
  description: string;
  mitigation: string;
};

export type ExecutionStage = {
  id: string;
  title: string;
  description: string;
  assignedAgents: OsaAgentDefinition[];
  estimatedMinutes: number;
  dependsOn: string[];
  parallel: boolean;
  status: ExecutionStageStatus;
};

export type ExecutionPlan = {
  stages: ExecutionStage[];
  dependencies: Record<string, string[]>;
  parallelGroups: string[][];
  estimatedMinutes: number;
  risks: ExecutionRisk[];
  executionMode: ExecutionMode;
  reviewRequired: boolean;
};

export type BuildExecutionPlanInput = {
  userInput: string;
  team: OsaAgentDefinition[];
  recommendation?: NavigatorRecommendation;
};

type StageTemplate = {
  id: string;
  title: string;
  description: string;
  agentIds: OsaAgentId[];
  estimatedMinutes: number;
  dependsOn: string[];
  parallel: boolean;
};

const BASE_STAGE_TEMPLATES: StageTemplate[] = [
  {
    id: 'discovery',
    title: 'Stage 1 — Discovery & Brief',
    description: 'Сбор контекста, уточнение целей и формирование рабочего брифа.',
    agentIds: ['business-manager', 'analyst'],
    estimatedMinutes: 15,
    dependsOn: [],
    parallel: false,
  },
  {
    id: 'execution',
    title: 'Stage 2 — Execution',
    description: 'Параллельная работа специалистов по ключевым направлениям задачи.',
    agentIds: [],
    estimatedMinutes: 30,
    dependsOn: ['discovery'],
    parallel: true,
  },
  {
    id: 'review',
    title: 'Stage 3 — Review & Delivery',
    description: 'Сверка результатов, финальная проверка и передача итогов.',
    agentIds: ['business-manager', 'analyst'],
    estimatedMinutes: 10,
    dependsOn: ['execution'],
    parallel: false,
  },
];

type RiskRule = {
  id: string;
  severity: ExecutionRiskSeverity;
  title: string;
  description: string;
  mitigation: string;
  patterns: string[];
  when?: (context: RiskContext) => boolean;
};

type RiskContext = {
  text: string;
  teamSize: number;
  confidence: number;
  needsNavigatorReview: boolean;
  hasUrgency: boolean;
  hasComplexity: boolean;
  hasParallelStage: boolean;
};

function normalizeInput(input: string): string {
  return normalizeOsaText(input);
}

function matchesPattern(text: string, pattern: string): boolean {
  return matchesAnyOsaPattern(text, [pattern]);
}

function pickAgents(team: OsaAgentDefinition[], agentIds: OsaAgentId[]): OsaAgentDefinition[] {
  const byId = new Map(team.map((agent) => [agent.id, agent]));
  const picked: OsaAgentDefinition[] = [];

  for (const agentId of agentIds) {
    const agent = byId.get(agentId);
    if (agent) {
      picked.push(agent);
    }
  }

  return picked;
}

function pickExecutionAgents(team: OsaAgentDefinition[]): OsaAgentDefinition[] {
  const specialists = team.filter(
    (agent) => agent.id !== 'business-manager' && agent.id !== 'analyst',
  );

  if (specialists.length > 0) {
    return specialists;
  }

  return team.length > 0 ? [team[0]!] : [];
}

function buildDependencies(stages: ExecutionStage[]): Record<string, string[]> {
  return stages.reduce<Record<string, string[]>>((dependencies, stage) => {
    dependencies[stage.id] = [...stage.dependsOn];
    return dependencies;
  }, {});
}

function buildParallelGroups(stages: ExecutionStage[]): string[][] {
  const parallelStage = stages.find((stage) => stage.parallel);

  if (!parallelStage || parallelStage.assignedAgents.length <= 1) {
    return [];
  }

  return [parallelStage.assignedAgents.map((agent) => agent.id)];
}

function resolveExecutionMode(stages: ExecutionStage[]): ExecutionMode {
  const parallelStage = stages.find((stage) => stage.parallel);

  if (!parallelStage || parallelStage.assignedAgents.length <= 1) {
    return 'sequential';
  }

  if (parallelStage.assignedAgents.length >= 3) {
    return 'parallel';
  }

  return 'hybrid';
}

function calculateCriticalPathMinutes(stages: ExecutionStage[]): number {
  const stageMap = new Map(stages.map((stage) => [stage.id, stage]));
  const memo = new Map<string, number>();

  function resolve(stageId: string): number {
    const cached = memo.get(stageId);
    if (cached !== undefined) {
      return cached;
    }

    const stage = stageMap.get(stageId);
    if (!stage) {
      return 0;
    }

    const dependencyCost =
      stage.dependsOn.length > 0
        ? Math.max(...stage.dependsOn.map((dependencyId) => resolve(dependencyId)))
        : 0;

    const total = dependencyCost + stage.estimatedMinutes;
    memo.set(stageId, total);
    return total;
  }

  const terminalStages = stages.filter(
    (stage) => !stages.some((candidate) => candidate.dependsOn.includes(stage.id)),
  );

  if (terminalStages.length === 0) {
    return stages.reduce((sum, stage) => sum + stage.estimatedMinutes, 0);
  }

  return Math.max(...terminalStages.map((stage) => resolve(stage.id)));
}

function buildRiskContext(
  userInput: string,
  team: OsaAgentDefinition[],
  recommendation: NavigatorRecommendation | undefined,
  hasParallelStage: boolean,
): RiskContext {
  const text = normalizeInput(userInput);
  const urgencyPatterns = ['срочно', 'сегодня', 'завтра', 'asap', 'быстро', 'немедленно'];
  const complexityPatterns = ['сложн', 'много этап', 'долгий цикл', 'enterprise', 'крупн'];

  return {
    text,
    teamSize: team.length,
    confidence: recommendation?.confidence ?? 50,
    needsNavigatorReview: recommendation?.needsNavigatorReview ?? false,
    hasUrgency: urgencyPatterns.some((pattern) => matchesPattern(text, pattern)),
    hasComplexity: complexityPatterns.some((pattern) => matchesPattern(text, pattern)),
    hasParallelStage,
  };
}

const RISK_RULES: RiskRule[] = [
  {
    id: 'low-confidence',
    severity: 'high',
    title: 'Низкая уверенность Navigator',
    description:
      'Navigator не уверен в интерпретации запроса — план может потребовать корректировки.',
    mitigation: 'Добавьте детали задачи и подтвердите приоритеты перед запуском execution stage.',
    patterns: [],
    when: (context) => context.needsNavigatorReview || context.confidence < 55,
  },
  {
    id: 'urgency',
    severity: 'medium',
    title: 'Сжатые сроки',
    description:
      'Запрос содержит признаки срочности — параллельные этапы могут потребовать review раньше.',
    mitigation: 'Сфокусируйте Stage 2 на одном deliverable и сократите scope первой итерации.',
    patterns: ['срочно', 'сегодня', 'завтра', 'asap', 'быстро', 'немедленно'],
  },
  {
    id: 'complexity',
    severity: 'medium',
    title: 'Высокая сложность задачи',
    description: 'Задача выглядит многоэтапной — оценка ETA может быть занижена.',
    mitigation:
      'Разбейте Stage 2 на подзадачи и зафиксируйте критерии готовности для каждого агента.',
    patterns: ['сложн', 'много этап', 'долгий цикл', 'enterprise', 'крупн', 'интеграц'],
  },
  {
    id: 'large-team',
    severity: 'low',
    title: 'Большая команда агентов',
    description: 'Параллельная работа нескольких агентов повышает риск расхождения результатов.',
    mitigation: 'Business Manager синхронизирует deliverables перед Stage 3.',
    patterns: [],
    when: (context) => context.hasParallelStage && context.teamSize >= 5,
  },
  {
    id: 'legal-compliance',
    severity: 'high',
    title: 'Юридические и compliance-риски',
    description: 'В запросе упоминаются договоры или compliance — нужна дополнительная проверка.',
    mitigation: 'Подключите AI Lawyer на review stage до финальной передачи результатов.',
    patterns: ['договор', 'юрид', 'compliance', 'gdpr', 'лиценз'],
  },
  {
    id: 'data-quality',
    severity: 'low',
    title: 'Неполный контекст',
    description:
      'Запрос короткий или без явных deliverables — discovery stage займёт больше времени.',
    mitigation: 'Уточните целевой результат и ограничения в workspace перед execution.',
    patterns: [],
    when: (context) => context.text.trim().length < 40,
  },
];

function detectExecutionRisks(context: RiskContext): ExecutionRisk[] {
  const risks: ExecutionRisk[] = [];
  const seen = new Set<string>();

  for (const rule of RISK_RULES) {
    const patternMatch = rule.patterns.some((pattern) => matchesPattern(context.text, pattern));
    const conditionalMatch = rule.when?.(context) ?? false;

    if (!patternMatch && !conditionalMatch) {
      continue;
    }

    if (seen.has(rule.id)) {
      continue;
    }

    seen.add(rule.id);
    risks.push({
      id: rule.id,
      severity: rule.severity,
      title: rule.title,
      description: rule.description,
      mitigation: rule.mitigation,
    });
  }

  return risks.sort((left, right) => {
    const severityRank: Record<ExecutionRiskSeverity, number> = {
      high: 0,
      medium: 1,
      low: 2,
    };

    return severityRank[left.severity] - severityRank[right.severity];
  });
}

function buildStages(team: OsaAgentDefinition[]): ExecutionStage[] {
  return BASE_STAGE_TEMPLATES.map((template) => {
    const assignedAgents =
      template.id === 'execution' ? pickExecutionAgents(team) : pickAgents(team, template.agentIds);

    const estimatedMinutes =
      template.id === 'execution'
        ? Math.max(template.estimatedMinutes, assignedAgents.length * 10)
        : template.estimatedMinutes;

    return {
      id: template.id,
      title: template.title,
      description: template.description,
      assignedAgents,
      estimatedMinutes,
      dependsOn: [...template.dependsOn],
      parallel: template.parallel && assignedAgents.length > 1,
      status: template.dependsOn.length === 0 ? 'ready' : 'pending',
    };
  });
}

export function buildExecutionPlan(input: BuildExecutionPlanInput): ExecutionPlan {
  const stages = buildStages(input.team);
  const dependencies = buildDependencies(stages);
  const parallelGroups = buildParallelGroups(stages);
  const executionMode = resolveExecutionMode(stages);
  const estimatedMinutes = calculateCriticalPathMinutes(stages);
  const riskContext = buildRiskContext(
    input.userInput,
    input.team,
    input.recommendation,
    parallelGroups.length > 0,
  );
  const risks = detectExecutionRisks(riskContext);
  const reviewRequired =
    (input.recommendation?.needsNavigatorReview ?? false) ||
    risks.some((risk) => risk.severity === 'high');

  return {
    stages,
    dependencies,
    parallelGroups,
    estimatedMinutes,
    risks,
    executionMode,
    reviewRequired,
  };
}

export function formatExecutionPlanEta(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} мин`;
  }

  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;

  if (remainder === 0) {
    return `${hours} ч`;
  }

  return `${hours} ч ${remainder} мин`;
}

export function buildExecutionPlanSummary(plan: ExecutionPlan): string {
  const stageCount = plan.stages.length;
  const riskCount = plan.risks.length;

  return `${stageCount} stage${stageCount === 1 ? '' : 's'} · ETA ${formatExecutionPlanEta(plan.estimatedMinutes)} · ${plan.executionMode} · ${riskCount} risk${riskCount === 1 ? '' : 's'}${plan.reviewRequired ? ' · review required' : ''}`;
}

export function serializeExecutionPlan(plan: ExecutionPlan): Record<string, unknown> {
  return {
    stages: plan.stages,
    dependencies: plan.dependencies,
    parallelGroups: plan.parallelGroups,
    estimatedMinutes: plan.estimatedMinutes,
    risks: plan.risks,
    executionMode: plan.executionMode,
    reviewRequired: plan.reviewRequired,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isExecutionMode(value: unknown): value is ExecutionMode {
  return value === 'sequential' || value === 'hybrid' || value === 'parallel';
}

function isExecutionStageStatus(value: unknown): value is ExecutionStageStatus {
  return value === 'pending' || value === 'ready' || value === 'running' || value === 'completed';
}

function isValidExecutionStage(value: unknown): value is ExecutionStage {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === 'string' &&
    value.id.trim().length > 0 &&
    typeof value.title === 'string' &&
    typeof value.description === 'string' &&
    Array.isArray(value.assignedAgents) &&
    typeof value.estimatedMinutes === 'number' &&
    Number.isFinite(value.estimatedMinutes) &&
    Array.isArray(value.dependsOn) &&
    value.dependsOn.every((item) => typeof item === 'string') &&
    typeof value.parallel === 'boolean' &&
    isExecutionStageStatus(value.status)
  );
}

export function isValidExecutionPlan(value: unknown): value is ExecutionPlan {
  if (!isRecord(value)) {
    return false;
  }

  if (
    !Array.isArray(value.stages) ||
    value.stages.length === 0 ||
    !value.stages.every(isValidExecutionStage)
  ) {
    return false;
  }

  if (!isRecord(value.dependencies)) {
    return false;
  }

  if (!Array.isArray(value.parallelGroups)) {
    return false;
  }

  if (typeof value.estimatedMinutes !== 'number' || !Number.isFinite(value.estimatedMinutes)) {
    return false;
  }

  if (!Array.isArray(value.risks)) {
    return false;
  }

  if (!isExecutionMode(value.executionMode)) {
    return false;
  }

  return typeof value.reviewRequired === 'boolean';
}

export type ResolveExecutionPlanInput = {
  userPrompt: string;
  businessDescription: string;
  selectedAgents: Array<{ id: string; name: string }>;
  executionPlan?: ExecutionPlan | null;
};

export function resolveExecutionPlanForTask(input: ResolveExecutionPlanInput): ExecutionPlan {
  if (input.executionPlan && isValidExecutionPlan(input.executionPlan)) {
    return input.executionPlan;
  }

  const team = resolveOsaAgentRefs(input.selectedAgents);

  const userInput = [input.businessDescription.trim(), input.userPrompt.trim()]
    .filter(Boolean)
    .join('\n');

  return buildExecutionPlan({
    userInput,
    team,
  });
}
