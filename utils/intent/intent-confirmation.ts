import type { HomeGoalId } from '@/utils/home/home-types';
import { getHomeGoalDefinition } from '@/utils/home/goal-handoff';
import type { ExecutionPlan } from '@/utils/osa/execution-planner';
import type { NavigatorRecommendation } from '@/utils/osa/navigator-engine';

export const INTENT_CONFIDENCE_THRESHOLD = 55;

export const INTENT_METRIC_EVENTS = {
  confirmationShown: 'intent_confirmation_shown',
  confirmationAccepted: 'intent_confirmation_accepted',
  clarificationShown: 'intent_clarification_shown',
  clarificationAnswered: 'intent_clarification_answered',
  goalChanged: 'intent_goal_changed',
  workStarted: 'intent_work_started',
  workCompleted: 'intent_work_completed',
} as const;

export type IntentClarificationOption = {
  id: string;
  label: string;
  promptSuffix: string;
};

export type IntentClarification = {
  question: string;
  options: [IntentClarificationOption, IntentClarificationOption];
};

export type IntentConfirmationData = {
  goalId: HomeGoalId;
  goalTitle: string;
  understood: string;
  willAnalyze: string[];
  willReceive: string[];
  estimatedTime: string;
  needsClarification: boolean;
  clarification: IntentClarification | null;
};

type GoalIntentTemplate = {
  understood: string;
  willAnalyze: string[];
  willReceive: string[];
  defaultMinutes: number;
  clarification?: IntentClarification;
};

const GOAL_INTENT_TEMPLATES: Record<HomeGoalId, GoalIntentTemplate> = {
  find_clients: {
    understood: 'You want to find more clients and build a reliable way to reach them.',
    willAnalyze: ['Your ideal customer', 'How you reach people today', 'Your market and offer'],
    willReceive: [
      'Audience analysis',
      'Customer profile',
      'Acquisition strategy',
      'Action plan',
    ],
    defaultMinutes: 2,
    clarification: {
      question: 'Are you looking for',
      options: [
        {
          id: 'customers',
          label: 'new customers',
          promptSuffix: ' Focus on acquiring new customers.',
        },
        {
          id: 'partners',
          label: 'new business partners',
          promptSuffix: ' Focus on finding business partners and collaborations.',
        },
      ],
    },
  },
  increase_revenue: {
    understood: 'You want to grow revenue with practical next steps.',
    willAnalyze: ['Your sales funnel', 'Where revenue comes from today', 'Quick wins and gaps'],
    willReceive: ['Revenue opportunities', 'Priority actions', 'Action plan'],
    defaultMinutes: 2,
    clarification: {
      question: 'Do you mainly want to grow through',
      options: [
        {
          id: 'existing',
          label: 'existing customers',
          promptSuffix: ' Focus on growing revenue from existing customers.',
        },
        {
          id: 'new',
          label: 'new customers',
          promptSuffix: ' Focus on finding new customers to grow revenue.',
        },
      ],
    },
  },
  launch_project: {
    understood: 'You want to launch a new business initiative with a clear plan.',
    willAnalyze: ['Your offer and goals', 'Key milestones', 'What needs to happen first'],
    willReceive: ['Launch overview', 'Milestone plan', 'First steps checklist'],
    defaultMinutes: 3,
  },
  create_content: {
    understood: 'You want content that supports your business goals.',
    willAnalyze: ['Your audience', 'Topics that fit your brand', 'Channels you use'],
    willReceive: ['Content ideas', 'Draft assets', 'Publishing plan'],
    defaultMinutes: 2,
  },
  automate_routine: {
    understood: 'You want to spend less time on repetitive work.',
    willAnalyze: ['Tasks that repeat often', 'Where time is lost', 'What can be simplified first'],
    willReceive: ['Automation opportunities', 'Recommended first workflow', 'Action plan'],
    defaultMinutes: 3,
  },
  organize_business: {
    understood: 'You want a clearer structure for projects, work, and information.',
    willAnalyze: ['How work is organized today', 'Projects and documents in use', 'Main bottlenecks'],
    willReceive: ['Organization overview', 'Suggested structure', 'Priority cleanup steps'],
    defaultMinutes: 3,
  },
  understand_ai: {
    understood: 'You want to understand how this platform can help your business.',
    willAnalyze: ['Your business context', 'Where help would matter most', 'A safe place to start'],
    willReceive: ['Plain-language overview', 'Recommended first use cases', 'Starter plan'],
    defaultMinutes: 2,
  },
  dont_know: {
    understood: 'You want guidance on where to begin.',
    willAnalyze: ['What matters most right now', 'Your current priorities', 'The simplest next step'],
    willReceive: ['Recommended focus', 'Suggested first goal', 'Simple action plan'],
    defaultMinutes: 2,
    clarification: {
      question: 'What matters most right now?',
      options: [
        {
          id: 'growth',
          label: 'getting more customers',
          promptSuffix: ' Help me focus on getting more customers first.',
        },
        {
          id: 'organization',
          label: 'getting organized',
          promptSuffix: ' Help me focus on getting my business organized first.',
        },
      ],
    },
  },
};

export function formatIntentEstimatedTime(minutes: number): string {
  if (minutes <= 2) {
    return 'About 2 minutes';
  }

  if (minutes <= 5) {
    return 'About 5 minutes';
  }

  if (minutes <= 10) {
    return 'About 10 minutes';
  }

  if (minutes <= 15) {
    return 'About 15 minutes';
  }

  return 'About 20 minutes';
}

function resolveEstimatedMinutes(plan: ExecutionPlan | null, fallbackMinutes: number): number {
  if (!plan || plan.estimatedMinutes <= 0) {
    return fallbackMinutes;
  }

  return Math.min(plan.estimatedMinutes, 20);
}

export function shouldAskIntentClarification(
  goalId: HomeGoalId,
  recommendation: NavigatorRecommendation,
): boolean {
  if (goalId === 'dont_know') {
    return true;
  }

  return recommendation.needsNavigatorReview || recommendation.confidence < INTENT_CONFIDENCE_THRESHOLD;
}

export function buildIntentConfirmation(input: {
  goalId: HomeGoalId;
  starterPrompt: string;
  executionPlan?: ExecutionPlan | null;
  recommendation?: NavigatorRecommendation | null;
  clarificationAnswerId?: string | null;
}): IntentConfirmationData {
  const goal = getHomeGoalDefinition(input.goalId);
  const template = GOAL_INTENT_TEMPLATES[input.goalId];
  const recommendation = input.recommendation ?? null;
  const needsClarification =
    !input.clarificationAnswerId &&
    recommendation !== null &&
    shouldAskIntentClarification(input.goalId, recommendation);

  let understood = template.understood;

  if (input.clarificationAnswerId && template.clarification) {
    const selected = template.clarification.options.find(
      (option) => option.id === input.clarificationAnswerId,
    );

    if (selected) {
      understood = `${understood} You said ${selected.label}.`;
    }
  }

  const minutes = resolveEstimatedMinutes(input.executionPlan ?? null, template.defaultMinutes);

  return {
    goalId: input.goalId,
    goalTitle: goal.title,
    understood,
    willAnalyze: template.willAnalyze,
    willReceive: template.willReceive,
    estimatedTime: formatIntentEstimatedTime(minutes),
    needsClarification,
    clarification: needsClarification ? (template.clarification ?? null) : null,
  };
}

export function applyClarificationToPrompt(
  goalId: HomeGoalId,
  starterPrompt: string,
  optionId: string,
): string {
  const template = GOAL_INTENT_TEMPLATES[goalId];
  const clarification = template.clarification;

  if (!clarification) {
    return starterPrompt;
  }

  const selected = clarification.options.find((option) => option.id === optionId);

  if (!selected) {
    return starterPrompt;
  }

  return `${starterPrompt.trim()}${selected.promptSuffix}`;
}

export function getIntentClarification(goalId: HomeGoalId): IntentClarification | null {
  return GOAL_INTENT_TEMPLATES[goalId].clarification ?? null;
}
