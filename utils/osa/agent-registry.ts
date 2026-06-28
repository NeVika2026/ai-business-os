export type OsaAgentCategory =
  | 'Leadership'
  | 'Marketing'
  | 'Sales'
  | 'Analytics'
  | 'Content'
  | 'Operations'
  | 'Legal'
  | 'Finance'
  | 'Support'
  | 'HR'
  | 'Project'
  | 'Knowledge'
  | 'Specialized';

export type OsaAgentId =
  | 'business-manager'
  | 'marketing'
  | 'crm'
  | 'analyst'
  | 'estate'
  | 'mlm'
  | 'content'
  | 'sales'
  | 'finance'
  | 'lawyer'
  | 'support'
  | 'hr'
  | 'project-manager'
  | 'knowledge-manager';

export type OsaAgent = {
  id: OsaAgentId;
  name: string;
  title: string;
  description: string;
  category: OsaAgentCategory;
  skills: string[];
  tools: string[];
  worksWith: OsaAgentId[];
  defaultStatus: string;
  tags: string[];
  isCore: boolean;
};

export type OsaAgentDefinition = Pick<OsaAgent, 'id' | 'name' | 'description'> & {
  workspaceStatus: string;
};

const OSA_AGENTS: OsaAgent[] = [
  {
    id: 'business-manager',
    name: 'AI Business Manager',
    title: 'Business Manager',
    description: 'Координирует остальных агентов.',
    category: 'Leadership',
    skills: ['coordination', 'planning', 'delegation'],
    tools: ['tasks.read', 'tasks.create', 'analytics.read'],
    worksWith: ['marketing', 'crm', 'analyst', 'project-manager'],
    defaultStatus: 'Работает',
    tags: ['core', 'leadership', 'operations'],
    isCore: true,
  },
  {
    id: 'marketing',
    name: 'AI Marketing',
    title: 'Marketing Director',
    description: 'Создаёт рекламу, посты и контент.',
    category: 'Marketing',
    skills: ['campaigns', 'positioning', 'channel-strategy'],
    tools: ['content.generate', 'analytics.read', 'tasks.create'],
    worksWith: ['content', 'analyst', 'sales'],
    defaultStatus: 'Готовит стратегию',
    tags: ['core', 'marketing', 'growth'],
    isCore: true,
  },
  {
    id: 'crm',
    name: 'AI CRM',
    title: 'CRM Manager',
    description: 'Ведёт клиентов и напоминает о следующих шагах.',
    category: 'Sales',
    skills: ['pipeline-hygiene', 'follow-ups', 'segmentation'],
    tools: ['crm.read', 'crm.write', 'tasks.create'],
    worksWith: ['sales', 'support', 'analyst'],
    defaultStatus: 'Создаёт карточку клиента',
    tags: ['core', 'sales', 'crm'],
    isCore: true,
  },
  {
    id: 'analyst',
    name: 'AI Analyst',
    title: 'Data Analyst',
    description: 'Анализирует эффективность и предлагает улучшения.',
    category: 'Analytics',
    skills: ['metrics', 'reporting', 'dashboards'],
    tools: ['analytics.read', 'crm.read', 'tasks.read'],
    worksWith: ['marketing', 'crm', 'finance'],
    defaultStatus: 'Считает показатели',
    tags: ['core', 'analytics', 'insights'],
    isCore: true,
  },
  {
    id: 'estate',
    name: 'AI Estate',
    title: 'Real Estate Advisor',
    description: 'Подбирает недвижимость и рассчитывает инвестиции.',
    category: 'Specialized',
    skills: ['property-analysis', 'investment-modeling', 'market-research'],
    tools: ['knowledge.search', 'tasks.create', 'analytics.read'],
    worksWith: ['sales', 'analyst', 'marketing'],
    defaultStatus: 'Анализирует объекты',
    tags: ['real-estate', 'research', 'sales'],
    isCore: false,
  },
  {
    id: 'mlm',
    name: 'AI MLM',
    title: 'Network Marketing Coach',
    description: 'Помогает с рекрутингом, контентом и обработкой возражений.',
    category: 'Specialized',
    skills: ['recruiting', 'objection-handling', 'team-building'],
    tools: ['content.generate', 'crm.write', 'tasks.create'],
    worksWith: ['content', 'sales', 'marketing'],
    defaultStatus: 'Готовит рекрутинговую систему',
    tags: ['mlm', 'network-marketing', 'recruiting'],
    isCore: false,
  },
  {
    id: 'content',
    name: 'AI Content',
    title: 'Content Manager',
    description: 'Создаёт посты, сценарии, видео и публикации.',
    category: 'Content',
    skills: ['content-planning', 'copywriting', 'publishing'],
    tools: ['content.generate', 'content.schedule', 'knowledge.search'],
    worksWith: ['marketing', 'sales', 'knowledge-manager'],
    defaultStatus: 'Создаёт контент-план',
    tags: ['content', 'social', 'creative'],
    isCore: false,
  },
  {
    id: 'sales',
    name: 'AI Sales',
    title: 'Sales Manager',
    description: 'Квалифицирует лиды, ведёт переговоры и закрывает сделки.',
    category: 'Sales',
    skills: ['outreach', 'qualification', 'closing'],
    tools: ['crm.read', 'crm.write', 'tasks.create', 'content.generate'],
    worksWith: ['crm', 'marketing', 'support'],
    defaultStatus: 'Готовит outreach',
    tags: ['sales', 'leads', 'deals'],
    isCore: false,
  },
  {
    id: 'finance',
    name: 'AI Finance',
    title: 'Financial Analyst',
    description: 'Следит за финансами, прогнозами и отчётностью.',
    category: 'Finance',
    skills: ['forecasting', 'budgeting', 'reporting'],
    tools: ['analytics.read', 'tasks.create'],
    worksWith: ['analyst', 'business-manager', 'project-manager'],
    defaultStatus: 'Сверяет показатели',
    tags: ['finance', 'analytics', 'reporting'],
    isCore: false,
  },
  {
    id: 'lawyer',
    name: 'AI Lawyer',
    title: 'Legal Advisor',
    description: 'Проверяет договоры, compliance и юридические риски.',
    category: 'Legal',
    skills: ['contracts', 'compliance', 'risk-review'],
    tools: ['knowledge.search', 'tasks.create'],
    worksWith: ['business-manager', 'finance', 'hr'],
    defaultStatus: 'Проверяет документы',
    tags: ['legal', 'compliance', 'contracts'],
    isCore: false,
  },
  {
    id: 'support',
    name: 'AI Support',
    title: 'Customer Support',
    description: 'Отвечает клиентам и решает обращения в поддержку.',
    category: 'Support',
    skills: ['customer-service', 'ticket-triage', 'faq'],
    tools: ['crm.read', 'crm.write', 'tasks.create'],
    worksWith: ['crm', 'sales', 'knowledge-manager'],
    defaultStatus: 'Обрабатывает обращения',
    tags: ['support', 'customer-service', 'inbox'],
    isCore: false,
  },
  {
    id: 'hr',
    name: 'AI HR',
    title: 'HR Manager',
    description: 'Помогает с наймом, onboarding и HR-процессами.',
    category: 'HR',
    skills: ['recruiting', 'onboarding', 'policies'],
    tools: ['tasks.create', 'knowledge.search'],
    worksWith: ['business-manager', 'project-manager', 'lawyer'],
    defaultStatus: 'Ведёт HR-процессы',
    tags: ['hr', 'people', 'recruiting'],
    isCore: false,
  },
  {
    id: 'project-manager',
    name: 'AI Project Manager',
    title: 'Project Manager',
    description: 'Планирует задачи, сроки и координирует исполнение.',
    category: 'Project',
    skills: ['planning', 'task-tracking', 'delivery'],
    tools: ['tasks.read', 'tasks.create', 'analytics.read'],
    worksWith: ['business-manager', 'analyst', 'content'],
    defaultStatus: 'Собирает план работ',
    tags: ['project', 'planning', 'operations'],
    isCore: false,
  },
  {
    id: 'knowledge-manager',
    name: 'AI Knowledge Manager',
    title: 'Knowledge Manager',
    description: 'Организует базу знаний и помогает находить нужную информацию.',
    category: 'Knowledge',
    skills: ['knowledge-curation', 'search', 'documentation'],
    tools: ['knowledge.search', 'knowledge.import', 'tasks.create'],
    worksWith: ['support', 'content', 'analyst'],
    defaultStatus: 'Индексирует знания',
    tags: ['knowledge', 'documentation', 'search'],
    isCore: false,
  },
];

const AGENTS_BY_ID = new Map<string, OsaAgent>(OSA_AGENTS.map((agent) => [agent.id, agent]));
const AGENTS_BY_NAME = new Map<string, OsaAgent>(
  OSA_AGENTS.map((agent) => [agent.name.trim().toLowerCase(), agent]),
);

export function listOsaAgents(): OsaAgent[] {
  return [...OSA_AGENTS];
}

export function getOsaAgentById(id: string): OsaAgent | undefined {
  return AGENTS_BY_ID.get(id);
}

export function getOsaAgentByName(name: string): OsaAgent | undefined {
  return AGENTS_BY_NAME.get(name.trim().toLowerCase());
}

export function getOsaAgentsByCategory(category: OsaAgentCategory): OsaAgent[] {
  return OSA_AGENTS.filter((agent) => agent.category === category);
}

export function getCoreOsaAgents(): OsaAgent[] {
  return OSA_AGENTS.filter((agent) => agent.isCore);
}

export function getOsaAgentsByTags(tags: string[]): OsaAgent[] {
  const normalizedTags = new Set(tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean));

  if (normalizedTags.size === 0) {
    return [];
  }

  return OSA_AGENTS.filter((agent) =>
    agent.tags.some((tag) => normalizedTags.has(tag.trim().toLowerCase())),
  );
}

export function resolveOsaAgents(idsOrNames: string[]): OsaAgent[] {
  const seen = new Set<string>();
  const resolved: OsaAgent[] = [];

  for (const value of idsOrNames) {
    const trimmed = value.trim();

    if (!trimmed) {
      continue;
    }

    const agent = getOsaAgentById(trimmed) ?? getOsaAgentByName(trimmed);

    if (!agent || seen.has(agent.id)) {
      continue;
    }

    seen.add(agent.id);
    resolved.push(agent);
  }

  return resolved;
}

export function toOsaAgentDefinition(agent: OsaAgent): OsaAgentDefinition {
  return {
    id: agent.id,
    name: agent.name,
    description: agent.description,
    workspaceStatus: agent.defaultStatus,
  };
}

export function getOsaAgentDefinitionById(id: string): OsaAgentDefinition | undefined {
  const agent = getOsaAgentById(id);
  return agent ? toOsaAgentDefinition(agent) : undefined;
}

export function resolveOsaAgentRefs(
  agents: Array<{ id: string; name: string }>,
): OsaAgentDefinition[] {
  return agents.map((agent) => {
    const definition = getOsaAgentDefinitionById(agent.id);

    if (definition) {
      return definition;
    }

    return {
      id: agent.id as OsaAgentId,
      name: agent.name,
      description: '',
      workspaceStatus: 'Ready',
    };
  });
}

export const OSA_AGENT_TRACE_ORDER: OsaAgentId[] = [
  'business-manager',
  'marketing',
  'estate',
  'crm',
  'sales',
  'analyst',
  'mlm',
  'content',
  'support',
  'finance',
  'lawyer',
  'hr',
  'project-manager',
  'knowledge-manager',
];
