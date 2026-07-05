import type { ProjectType } from '@/utils/projects/project-types';

export const DEMO_PROJECT_MARKER = 'osa-investor-demo-v1';

export type DemoProjectTemplate = {
  name: string;
  description: string;
  declaredType: ProjectType;
};

export const DEMO_PROJECT_TEMPLATES: DemoProjectTemplate[] = [
  {
    name: 'OSA Product',
    description: 'Подготовить investor demo для OSA Product',
    declaredType: 'marketing',
  },
  {
    name: 'Landing Page',
    description: 'Запустить landing page для investor demo',
    declaredType: 'marketing',
  },
  {
    name: 'Investment Platform',
    description: 'Подготовить investor demo для investment platform',
    declaredType: 'finance',
  },
];

export function buildDemoProjectDescription(template: DemoProjectTemplate): string {
  return `${template.description}\n${DEMO_PROJECT_MARKER}`;
}

export function isDemoProjectDescription(description: string | null | undefined): boolean {
  return Boolean(description?.includes(DEMO_PROJECT_MARKER));
}

export function selectDemoProjectTemplate(seed = Date.now()): DemoProjectTemplate {
  const index = Math.abs(seed) % DEMO_PROJECT_TEMPLATES.length;

  return DEMO_PROJECT_TEMPLATES[index]!;
}
