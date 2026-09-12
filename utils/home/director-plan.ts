import { buildSkillModeLabel, selectSkillForPrompt } from '@/lib/skills/skill-selector';
import { buildHomeTaskPrompt, type HomeQuickActionId } from '@/utils/home/home-action';
import {
  buildClarificationQuestions,
  buildEnrichedRealWorkPrompt,
  needsClarification,
  type ClarificationAnswer,
  type RealWorkTaskType,
} from '@/utils/home/real-work-mode';
import {
  buildExecutionPlan,
  formatExecutionPlanEta,
  type ExecutionRiskSeverity,
} from '@/utils/osa/execution-planner';
import { getOsaTeamRecommendation } from '@/utils/osa/team-recommendation';

export type HomeDirectorPlanTeamMember = {
  id: string;
  name: string;
  description: string;
};

export type HomeDirectorPlanStage = {
  id: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  agents: string[];
  parallel: boolean;
};

export type HomeDirectorPlanRisk = {
  severity: ExecutionRiskSeverity;
  title: string;
  description: string;
};

export type HomeDirectorPlanResult =
  | {
      status: 'clarify';
      taskType: RealWorkTaskType;
      questions: string[];
      skillModeLabel: string;
    }
  | {
      status: 'ready';
      taskType: RealWorkTaskType;
      skillModeLabel: string;
      resolvedPrompt: string;
      team: HomeDirectorPlanTeamMember[];
      stages: HomeDirectorPlanStage[];
      estimatedMinutes: number;
      estimatedTime: string;
      risks: HomeDirectorPlanRisk[];
      reviewRequired: boolean;
    };

export function buildHomeDirectorPlan(
  input: string,
  quickActionId?: HomeQuickActionId,
  clarifications: ClarificationAnswer[] = [],
): HomeDirectorPlanResult {
  const basePrompt = buildHomeTaskPrompt(input, quickActionId);
  const skill = selectSkillForPrompt(basePrompt, quickActionId);
  const taskType = skill.taskType;
  const skillModeLabel = buildSkillModeLabel(skill);

  if (!clarifications.length && needsClarification(basePrompt, taskType)) {
    return {
      status: 'clarify',
      taskType,
      questions: buildClarificationQuestions(taskType, basePrompt),
      skillModeLabel,
    };
  }

  const resolvedPrompt = buildEnrichedRealWorkPrompt(
    basePrompt,
    taskType,
    clarifications,
  );
  const recommendation = getOsaTeamRecommendation(resolvedPrompt);
  const plan = buildExecutionPlan({
    userInput: resolvedPrompt,
    team: recommendation.team,
    recommendation: recommendation.recommendation,
  });

  return {
    status: 'ready',
    taskType,
    skillModeLabel,
    resolvedPrompt,
    team: recommendation.team.map((agent) => ({
      id: agent.id,
      name: agent.name,
      description: agent.description,
    })),
    stages: plan.stages.map((stage) => ({
      id: stage.id,
      title: stage.title,
      description: stage.description,
      estimatedMinutes: stage.estimatedMinutes,
      agents: stage.assignedAgents.map((agent) => agent.name),
      parallel: stage.parallel,
    })),
    estimatedMinutes: plan.estimatedMinutes,
    estimatedTime: formatExecutionPlanEta(plan.estimatedMinutes),
    risks: plan.risks.map((risk) => ({
      severity: risk.severity,
      title: risk.title,
      description: risk.description,
    })),
    reviewRequired: plan.reviewRequired,
  };
}
