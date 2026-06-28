export type OsaAgentId =
  | 'business-manager'
  | 'marketing'
  | 'crm'
  | 'analyst'
  | 'estate'
  | 'mlm'
  | 'content';

export type OsaAgentDefinition = {
  id: OsaAgentId;
  name: string;
  description: string;
  workspaceStatus: string;
};

const BASE_AGENTS: OsaAgentDefinition[] = [
  {
    id: 'business-manager',
    name: 'AI Business Manager',
    description: 'Координирует остальных агентов.',
    workspaceStatus: 'Работает',
  },
  {
    id: 'marketing',
    name: 'AI Marketing',
    description: 'Создаёт рекламу, посты и контент.',
    workspaceStatus: 'Готовит стратегию',
  },
  {
    id: 'crm',
    name: 'AI CRM',
    description: 'Ведёт клиентов и напоминает о следующих шагах.',
    workspaceStatus: 'Создаёт карточку клиента',
  },
  {
    id: 'analyst',
    name: 'AI Analyst',
    description: 'Анализирует эффективность и предлагает улучшения.',
    workspaceStatus: 'Считает показатели',
  },
];

const ESTATE_KEYWORDS = [
  'недвижимость',
  'недвижимости',
  'квартир',
  'новострой',
  'ипотек',
  'инвест-брокер',
  'инвест брокер',
  'риелтор',
  'риэлтор',
];

const MLM_KEYWORDS = ['сетевой', 'сетевик', 'млм', 'mlm', 'famall', 'рекрутинг', 'рекрут'];

const CONTENT_KEYWORDS = [
  'контент',
  'блог',
  'reels',
  'shorts',
  'telegram',
  'телеграм',
  'вк',
  'вконтакте',
];

const OPTIONAL_AGENTS: Record<'estate' | 'mlm' | 'content', OsaAgentDefinition> = {
  estate: {
    id: 'estate',
    name: 'AI Estate',
    description: 'Подбирает недвижимость и рассчитывает инвестиции.',
    workspaceStatus: 'Анализирует объекты',
  },
  mlm: {
    id: 'mlm',
    name: 'AI MLM',
    description: 'Помогает с рекрутингом, контентом и обработкой возражений.',
    workspaceStatus: 'Готовит рекрутинговую систему',
  },
  content: {
    id: 'content',
    name: 'AI Content',
    description: 'Создаёт посты, сценарии, видео и публикации.',
    workspaceStatus: 'Создаёт контент-план',
  },
};

function normalizeInput(input: string): string {
  return input.trim().toLowerCase();
}

function matchesKeywords(text: string, keywords: string[]): boolean {
  return keywords.some((keyword) => text.includes(keyword));
}

export function recommendOsaTeam(userInput: string): OsaAgentDefinition[] {
  const text = normalizeInput(userInput);
  const team = [...BASE_AGENTS];

  if (matchesKeywords(text, ESTATE_KEYWORDS)) {
    team.push(OPTIONAL_AGENTS.estate);
  }

  if (matchesKeywords(text, MLM_KEYWORDS)) {
    team.push(OPTIONAL_AGENTS.mlm);
  }

  if (matchesKeywords(text, CONTENT_KEYWORDS)) {
    team.push(OPTIONAL_AGENTS.content);
  }

  return team;
}

export const OSA_ONBOARDING_EXAMPLES = [
  'Я инвест-брокер и хочу больше клиентов',
  'Я стоматолог и устал отвечать в WhatsApp',
  'Я сетевик и хочу автоматизировать рекрутинг',
  'Я директор завода и хочу сократить рутину',
] as const;
