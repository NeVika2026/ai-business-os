import { attachProductionHandlers } from '@/services/runtime/tools/production-handlers';
import { communicationTools } from '@/services/runtime/tools/categories/communication';
import { crmTools } from '@/services/runtime/tools/categories/crm';
import { knowledgeTools } from '@/services/runtime/tools/categories/knowledge';
import { mcpTools } from '@/services/runtime/tools/categories/mcp';
import { storageTools } from '@/services/runtime/tools/categories/storage';
import { systemTools } from '@/services/runtime/tools/categories/system';
import { webTools } from '@/services/runtime/tools/categories/web';
import { ToolRegistry } from '@/services/runtime/tools/registry';
import type {
  RegisteredTool,
  RegisteredToolInput,
  ToolCategory,
  ToolRegistryListFilter,
} from '@/services/runtime/tools/tool-types';

const DEFAULT_MOCK_TOOLS: RegisteredToolInput[] = [
  ...crmTools,
  ...knowledgeTools,
  ...communicationTools,
  ...webTools,
  ...storageTools,
  ...systemTools,
  ...mcpTools,
];

function registerTools(registry: ToolRegistry, tools: RegisteredToolInput[]): void {
  for (const tool of tools) {
    registry.register(tool);
  }
}

export function createProductionToolRegistry(): ToolRegistry {
  return createToolRegistry(attachProductionHandlers(DEFAULT_MOCK_TOOLS));
}

export function createToolRegistry(
  tools: RegisteredToolInput[] = attachProductionHandlers(DEFAULT_MOCK_TOOLS),
): ToolRegistry {
  const registry = new ToolRegistry();
  registerTools(registry, tools);
  return registry;
}

export const toolRegistry = createToolRegistry();

export function registerMockTools(
  registry: ToolRegistry = toolRegistry,
  tools: RegisteredToolInput[] = DEFAULT_MOCK_TOOLS,
): void {
  registerTools(registry, tools);
}

export { registerTools, DEFAULT_MOCK_TOOLS };

export const toolRegistryApi = {
  register(tool: RegisteredToolInput): void {
    toolRegistry.register(tool);
  },
  unregister(id: string): void {
    toolRegistry.unregister(id);
  },
  get(id: string): RegisteredTool | undefined {
    return toolRegistry.get(id);
  },
  list(filter?: ToolRegistryListFilter): RegisteredTool[] {
    return toolRegistry.list(filter);
  },
  exists(id: string): boolean {
    return toolRegistry.exists(id);
  },
  categories(): ToolCategory[] {
    return toolRegistry.categories();
  },
  listByCategory(category: ToolCategory): RegisteredTool[] {
    return toolRegistry.listByCategory(category);
  },
};

export { ToolRegistry } from '@/services/runtime/tools/registry';
export type {
  RegisteredTool,
  RegisteredToolInput,
  ToolApprovalPolicy,
  ToolCategory,
  ToolHandlerContext,
  ToolPermissionSpec,
  ToolRegistryListFilter,
  ToolRetryPolicy,
} from '@/services/runtime/tools/tool-types';
export { TOOL_CATEGORIES } from '@/services/runtime/tools/tool-types';
export {
  DuplicateToolError,
  InvalidToolRegistrationError,
  ToolNotFoundError,
  ToolRegistryError,
} from '@/services/runtime/tools/tool-errors';
export {
  BaseToolHandler,
  RegistryStubHandler,
  registryStubHandler,
} from '@/services/runtime/tools/handlers/base-handler';
