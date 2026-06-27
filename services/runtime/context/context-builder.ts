import type { ContextBudget } from '@/services/runtime/context/budget';
import { getContextBudget } from '@/services/runtime/context/budget';
import { fetchCrm } from '@/services/runtime/context/providers/crm';
import { fetchEmployee } from '@/services/runtime/context/providers/employee';
import { fetchKnowledge } from '@/services/runtime/context/providers/knowledge';
import { fetchMemory } from '@/services/runtime/context/providers/memory';
import { fetchOrganization } from '@/services/runtime/context/providers/organization';
import { fetchUser } from '@/services/runtime/context/providers/user';
import { selectKnowledgeChunks } from '@/services/runtime/context/selectors/knowledge-selector';
import { selectMemoryEntries } from '@/services/runtime/context/selectors/memory-selector';
import { selectCrmLeads } from '@/services/runtime/context/selectors/crm-selector';
import { MOCK_RETRIEVED_AT, type BuildContextInput } from '@/services/runtime/context/types';
import { validateBuildContextInput } from '@/services/runtime/context/validation';
import type { ContextPackage } from '@/types/runtime/dto';

export function buildContext(
  input: BuildContextInput,
  budgetOverride?: Partial<ContextBudget>,
): ContextPackage {
  validateBuildContextInput(input);

  const budget = getContextBudget(budgetOverride);
  const organization = fetchOrganization(input.scope.organizationId);
  const employee = fetchEmployee(input.employeeId, input.scope.organizationId);
  const user = fetchUser(input);
  const knowledge = fetchKnowledge(input.scope.organizationId, input.request.action);
  const memory = fetchMemory(input.scope.organizationId, input.employeeId);
  const crm = fetchCrm(input.scope.organizationId);

  const knowledgeChunks = selectKnowledgeChunks(knowledge, input.request.action, budget);
  const memoryEntries = selectMemoryEntries(memory, budget);
  const crmLeads = selectCrmLeads(crm, budget);
  const retrievedAt = input.retrievedAt ?? MOCK_RETRIEVED_AT;

  return {
    scope: input.scope,
    trace: input.trace,
    employee: {
      id: employee.id,
      name: employee.name,
      roleTitle: employee.roleTitle,
      systemPrompt: employee.systemPrompt,
      configuration: employee.configuration,
      tools: employee.tools,
      permissions: employee.permissions,
    },
    provider: employee.provider,
    model: employee.model,
    task: input.taskId
      ? {
          id: input.taskId,
          title: 'Mock task',
          input: user.request.payload,
        }
      : null,
    userIntent: {
      action: user.request.action,
      payload: {
        ...user.request.payload,
        organization: {
          id: organization.id,
          name: organization.name,
          timezone: organization.timezone,
          locale: organization.locale,
        },
        history: user.history,
        knowledgeChunks,
        memoryEntries,
        crmLeads,
      },
    },
    retrievedAt,
  };
}

export const contextBuilder = {
  build: buildContext,
};
