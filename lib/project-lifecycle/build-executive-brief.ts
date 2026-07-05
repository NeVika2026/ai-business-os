import type { ProjectType } from '@/utils/projects/project-types';

import { projectTypeLabel } from './detect-project-type';
import type { ProjectLifecyclePlanStep } from './build-work-plan';
import type { ProjectLifecycleSpecialist } from './select-specialists';

export function buildExecutiveBriefText(input: {
  projectName: string;
  projectType: ProjectType;
  specialists: ProjectLifecycleSpecialist[];
  workPlan: ProjectLifecyclePlanStep[];
}): string {
  const team = input.specialists.map((member) => member.role).join(', ');
  const plan = input.workPlan.map((step, index) => `${index + 1}. ${step.title}`).join('\n');

  return [
    `Executive Brief — ${input.projectName}`,
    '',
    `Тип проекта: ${projectTypeLabel(input.projectType)}.`,
    `Команда: ${team}.`,
    `Рабочий план: ${input.workPlan.length} шага.`,
    `Фокус дня: ${input.workPlan[0]?.title ?? 'Продолжить проект'}.`,
    '',
    'OSA организовала проект без дополнительных вопросов.',
    'Следующий шаг уже выбран и готов к выполнению.',
    '',
    plan,
  ].join('\n');
}
