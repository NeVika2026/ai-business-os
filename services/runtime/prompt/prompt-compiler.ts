import { formatPromptMessages } from '@/services/runtime/prompt/formatter';
import { getPromptLimits, type PromptLimits } from '@/services/runtime/prompt/limits';
import { buildCrmSection } from '@/services/runtime/prompt/sections/crm';
import { buildEmployeeSection } from '@/services/runtime/prompt/sections/employee';
import {
  buildInjectedContextSections,
  selectInjectedContext,
} from '@/services/runtime/prompt/injected-context';
import { buildMemorySection } from '@/services/runtime/prompt/sections/memory';
import { buildSafetySection } from '@/services/runtime/prompt/sections/safety';
import { buildSystemSection } from '@/services/runtime/prompt/sections/system';
import { buildUserSection } from '@/services/runtime/prompt/sections/user';
import { estimateMessagesTokens } from '@/services/runtime/prompt/tokens';
import type { CompilePromptInput, PromptTemplateId } from '@/services/runtime/prompt/types';
import { COMPILER_VERSION } from '@/services/runtime/prompt/types';
import type { PromptRequest, ToolDefinition } from '@/types/runtime/dto';

const TOOL_CATALOG: Record<string, ToolDefinition> = {
  web_search: {
    name: 'web_search',
    description: 'Search the web for current information.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string' },
      },
      required: ['query'],
    },
  },
  crm_read: {
    name: 'crm_read',
    description: 'Read CRM leads for the current organization.',
    parameters: {
      type: 'object',
      properties: {
        lead_id: { type: 'string' },
        limit: { type: 'integer' },
      },
    },
  },
  knowledge_search: {
    name: 'knowledge_search',
    description: 'Search knowledge chunks for relevant context.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        limit: { type: 'integer' },
      },
      required: ['query'],
    },
  },
};

function resolveTools(context: CompilePromptInput['context']): ToolDefinition[] | undefined {
  const enabled = context.employee.tools.filter((tool) => tool.enabled).map((tool) => tool.id);
  const definitions = enabled
    .map((toolId) => TOOL_CATALOG[toolId])
    .filter((definition): definition is ToolDefinition => definition !== undefined);

  return definitions.length > 0 ? definitions : undefined;
}

function buildOrderedSections(
  input: CompilePromptInput,
  limits: PromptLimits,
  templateId: PromptTemplateId,
) {
  const injectedSelection = selectInjectedContext(input, limits);
  const injectedSections = buildInjectedContextSections(injectedSelection);

  return [
    buildSystemSection(templateId),
    buildEmployeeSection(input.context),
    ...injectedSections,
    buildMemorySection(input.memory, limits),
    buildCrmSection(input.crmItems, limits),
    buildUserSection(input.context),
    buildSafetySection(),
  ];
}

export function compilePrompt(
  input: CompilePromptInput,
  limitsOverride?: Partial<PromptLimits>,
): PromptRequest {
  const limits = getPromptLimits(limitsOverride);
  const templateId = input.templateId ?? 'default';
  const orderedSections = buildOrderedSections(input, limits, templateId);
  const messages = formatPromptMessages(orderedSections, input.conversationHistory ?? []);

  void estimateMessagesTokens(messages);

  const { context } = input;
  const configuration = context.employee.configuration;

  return {
    scope: context.scope,
    trace: context.trace,
    model: context.model.code,
    messages,
    tools: resolveTools(context),
    parameters: {
      temperature: configuration.temperature ?? 0.7,
      maxTokens: configuration.maxTokens ?? 4096,
      topP: configuration.topP,
    },
    metadata: {
      employeeId: context.employee.id,
      compilerVersion: COMPILER_VERSION,
    },
  };
}

export const promptCompiler = {
  compile: compilePrompt,
};
