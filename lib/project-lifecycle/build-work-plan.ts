import type { ProjectType } from '@/utils/projects/project-types';

export type ProjectLifecyclePlanStep = {
  title: string;
  estimate: string;
  priority: 'high' | 'medium' | 'low';
  priorityLabel: string;
};

const PRIORITY_LABEL = {
  high: 'Высокий приоритет',
  medium: 'Средний приоритет',
  low: 'Низкий приоритет',
} as const;

function stepsForType(type: ProjectType, projectName: string): ProjectLifecyclePlanStep[] {
  switch (type) {
    case 'marketing':
      return [
        {
          title: `Собрать стратегию для «${projectName}»`,
          estimate: '≈ 2 часа',
          priority: 'high',
          priorityLabel: PRIORITY_LABEL.high,
        },
        {
          title: 'Подготовить первый контент-результат',
          estimate: '≈ 45 минут',
          priority: 'medium',
          priorityLabel: PRIORITY_LABEL.medium,
        },
        {
          title: 'Настроить каналы масштабирования',
          estimate: '≈ 1 час',
          priority: 'low',
          priorityLabel: PRIORITY_LABEL.low,
        },
      ];

    case 'crm':
      return [
        {
          title: `Настроить воронку для «${projectName}»`,
          estimate: '≈ 2 часа',
          priority: 'high',
          priorityLabel: PRIORITY_LABEL.high,
        },
        {
          title: 'Подготовить первый outreach',
          estimate: '≈ 30 минут',
          priority: 'medium',
          priorityLabel: PRIORITY_LABEL.medium,
        },
        {
          title: 'Согласовать CRM-процесс',
          estimate: '≈ 45 минут',
          priority: 'low',
          priorityLabel: PRIORITY_LABEL.low,
        },
      ];

    case 'finance':
      return [
        {
          title: `Собрать финансовую картину «${projectName}»`,
          estimate: '≈ 2 часа',
          priority: 'high',
          priorityLabel: PRIORITY_LABEL.high,
        },
        {
          title: 'Подготовить первый отчёт',
          estimate: '≈ 45 минут',
          priority: 'medium',
          priorityLabel: PRIORITY_LABEL.medium,
        },
        {
          title: 'Зафиксировать KPI проекта',
          estimate: '≈ 30 минут',
          priority: 'low',
          priorityLabel: PRIORITY_LABEL.low,
        },
      ];

    default:
      return [
        {
          title: `Собрать рабочий план для «${projectName}»`,
          estimate: '≈ 2 часа',
          priority: 'high',
          priorityLabel: PRIORITY_LABEL.high,
        },
        {
          title: 'Получить первый материальный результат',
          estimate: '≈ 30 минут',
          priority: 'medium',
          priorityLabel: PRIORITY_LABEL.medium,
        },
        {
          title: 'Подготовить проект к масштабированию',
          estimate: '≈ 45 минут',
          priority: 'low',
          priorityLabel: PRIORITY_LABEL.low,
        },
      ];
  }
}

export function buildProjectWorkPlan(
  type: ProjectType,
  projectName: string,
): ProjectLifecyclePlanStep[] {
  return stepsForType(type, projectName);
}
