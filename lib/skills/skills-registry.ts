import type { OsaSkill, OsaSkillId } from '@/types/skills';

export const OSA_SKILLS: OsaSkill[] = [
  {
    id: 'estate-analysis',
    name: 'Анализ недвижимости',
    description: 'Разбор рынка, объектов и воронки продаж в недвижимости.',
    signals: ['недвиж', 'квартир', 'новострой', 'estate', 'объект', 'риелтор', 'жк'],
    team: ['business-manager', 'estate', 'analyst'],
    deliverables: ['business_strategy', 'presentation', 'sales_script'],
    primaryDeliverable: 'business_strategy',
    projectType: 'estate',
    taskType: 'analysis',
  },
  {
    id: 'presentation-create',
    name: 'Создание презентации',
    description: 'Структура слайдов, narrative и готовый deck.',
    signals: ['презент', 'слайд', 'pitch', 'presentation', 'дек', 'deck'],
    team: ['business-manager', 'project-manager', 'content'],
    deliverables: ['business_strategy', 'presentation', 'content_plan'],
    primaryDeliverable: 'presentation',
    projectType: 'general',
    taskType: 'presentation',
  },
  {
    id: 'landing-create',
    name: 'Создание лендинга',
    description: 'Посадочная страница с оффером, структурой и CTA.',
    signals: ['лендинг', 'landing', 'посадочн', 'сайт', 'страниц', 'cta'],
    team: ['business-manager', 'marketing', 'content'],
    deliverables: ['business_strategy', 'landing', 'content_plan'],
    primaryDeliverable: 'landing',
    projectType: 'marketing',
    taskType: 'landing',
  },
  {
    id: 'marketing-campaign',
    name: 'Маркетинговая кампания',
    description: 'Go-to-market план, каналы и первые материалы.',
    signals: ['маркет', 'реклам', 'кампан', 'marketing', 'продвиж', 'gtm'],
    team: ['business-manager', 'marketing', 'content'],
    deliverables: ['business_strategy', 'marketing_plan', 'content_plan'],
    primaryDeliverable: 'marketing_plan',
    projectType: 'marketing',
    taskType: 'marketing',
  },
  {
    id: 'content-plan',
    name: 'Контент-план',
    description: 'Темы, форматы и календарь публикаций.',
    signals: ['контент', 'пост', 'текст', 'content', 'блог', 'рассыл', 'telegram'],
    team: ['business-manager', 'content', 'marketing'],
    deliverables: ['business_strategy', 'content_plan', 'marketing_plan'],
    primaryDeliverable: 'content_plan',
    projectType: 'marketing',
    taskType: 'content',
  },
  {
    id: 'sales-playbook',
    name: 'Скрипт продаж',
    description: 'Сценарии звонков, писем и закрытия сделок.',
    signals: ['продаж', 'скрипт', 'воронк', 'sales', 'лид', 'звонок', 'outreach'],
    team: ['business-manager', 'sales', 'crm'],
    deliverables: ['business_strategy', 'sales_script', 'marketing_plan'],
    primaryDeliverable: 'sales_script',
    projectType: 'crm',
    taskType: 'sales',
  },
  {
    id: 'business-strategy',
    name: 'Бизнес-стратегия',
    description: 'Фокус, приоритеты и план роста.',
    signals: ['стратег', 'strategy', 'go-to-market', 'gtm', 'план рост', 'масштаб'],
    team: ['business-manager', 'analyst', 'project-manager'],
    deliverables: ['business_strategy', 'marketing_plan', 'presentation'],
    primaryDeliverable: 'business_strategy',
    projectType: 'general',
    taskType: 'strategy',
  },
  {
    id: 'market-analysis',
    name: 'Анализ рынка',
    description: 'Диагностика ниши, конкурентов и точек роста.',
    signals: ['анализ', 'разобра', 'аудит', 'analysis', 'слаб', 'диагност', 'рынок'],
    team: ['business-manager', 'analyst', 'finance'],
    deliverables: ['business_strategy', 'marketing_plan', 'presentation'],
    primaryDeliverable: 'business_strategy',
    projectType: 'finance',
    taskType: 'analysis',
  },
];

const SKILLS_BY_ID = new Map(OSA_SKILLS.map((skill) => [skill.id, skill]));

export function getSkillById(skillId: OsaSkillId): OsaSkill {
  const skill = SKILLS_BY_ID.get(skillId);

  if (!skill) {
    throw new Error(`Unknown skill: ${skillId}`);
  }

  return skill;
}

export function listOsaSkills(): OsaSkill[] {
  return [...OSA_SKILLS];
}
