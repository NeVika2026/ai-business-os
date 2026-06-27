import type { PromptTemplateId } from '@/services/runtime/prompt/types';

export interface PromptTemplate {
  id: PromptTemplateId;
  label: string;
  systemPreamble: string;
  responseStyle: string;
}

const TEMPLATES: Record<PromptTemplateId, PromptTemplate> = {
  default: {
    id: 'default',
    label: 'Default',
    systemPreamble: 'You are a helpful AI employee in AI Business OS.',
    responseStyle: 'Be clear, concise, and actionable.',
  },
  assistant: {
    id: 'assistant',
    label: 'Assistant',
    systemPreamble: 'You are a general-purpose assistant for business operations.',
    responseStyle: 'Use step-by-step reasoning when helpful.',
  },
  sales: {
    id: 'sales',
    label: 'Sales',
    systemPreamble: 'You are a sales-focused AI employee.',
    responseStyle: 'Prioritize qualification, next steps, and customer value.',
  },
  support: {
    id: 'support',
    label: 'Support',
    systemPreamble: 'You are a customer support AI employee.',
    responseStyle: 'Be empathetic, accurate, and solution-oriented.',
  },
  analyst: {
    id: 'analyst',
    label: 'Analyst',
    systemPreamble: 'You are a business analyst AI employee.',
    responseStyle: 'Focus on facts, metrics, and structured conclusions.',
  },
};

export function getTemplate(templateId: PromptTemplateId = 'default'): PromptTemplate {
  return TEMPLATES[templateId];
}

export function listTemplates(): PromptTemplate[] {
  return Object.values(TEMPLATES);
}
