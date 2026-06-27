import { registryStubHandler } from '@/services/runtime/tools/handlers/base-handler';
import {
  DuplicateToolError,
  InvalidToolRegistrationError,
  ToolNotFoundError,
} from '@/services/runtime/tools/tool-errors';
import type {
  RegisteredTool,
  RegisteredToolInput,
  ToolCategory,
  ToolRegistryListFilter,
} from '@/services/runtime/tools/tool-types';
import { TOOL_CATEGORIES } from '@/services/runtime/tools/tool-types';

function isNonEmptyString(value: string): boolean {
  return value.trim().length > 0;
}

function isToolCategory(value: string): value is ToolCategory {
  return (TOOL_CATEGORIES as readonly string[]).includes(value);
}

function normalizeToolInput(tool: RegisteredToolInput): RegisteredTool {
  return {
    ...tool,
    handler: tool.handler ?? registryStubHandler,
  };
}

function validateToolRegistration(tool: RegisteredToolInput): void {
  if (!isNonEmptyString(tool.id)) {
    throw new InvalidToolRegistrationError('Tool id is required');
  }

  if (!tool.category || !isNonEmptyString(tool.category)) {
    throw new InvalidToolRegistrationError('Tool category is required');
  }

  if (!isToolCategory(tool.category)) {
    throw new InvalidToolRegistrationError(`Invalid tool category: ${tool.category}`);
  }

  if (!isNonEmptyString(tool.name)) {
    throw new InvalidToolRegistrationError('Tool name is required');
  }

  if (!isNonEmptyString(tool.description)) {
    throw new InvalidToolRegistrationError('Tool description is required');
  }

  if (!isNonEmptyString(tool.version)) {
    throw new InvalidToolRegistrationError('Tool version is required');
  }
}

export class ToolRegistry {
  private readonly tools = new Map<string, RegisteredTool>();

  register(tool: RegisteredToolInput): void {
    validateToolRegistration(tool);

    if (this.tools.has(tool.id)) {
      throw new DuplicateToolError(tool.id);
    }

    this.tools.set(tool.id, normalizeToolInput(tool));
  }

  unregister(id: string): void {
    if (!isNonEmptyString(id)) {
      throw new InvalidToolRegistrationError('Tool id is required');
    }

    if (!this.tools.has(id)) {
      throw new ToolNotFoundError(id);
    }

    this.tools.delete(id);
  }

  get(id: string): RegisteredTool | undefined {
    return this.tools.get(id);
  }

  exists(id: string): boolean {
    return this.tools.has(id);
  }

  list(filter?: ToolRegistryListFilter): RegisteredTool[] {
    let tools = Array.from(this.tools.values());

    if (filter?.category) {
      tools = tools.filter((tool) => tool.category === filter.category);
    }

    if (filter?.enabled !== undefined) {
      tools = tools.filter((tool) => tool.enabled === filter.enabled);
    }

    return tools.sort((left, right) => left.id.localeCompare(right.id));
  }

  categories(): ToolCategory[] {
    const unique = new Set<ToolCategory>();

    for (const tool of this.tools.values()) {
      unique.add(tool.category);
    }

    return Array.from(unique).sort();
  }

  listByCategory(category: ToolCategory): RegisteredTool[] {
    if (!isToolCategory(category)) {
      throw new InvalidToolRegistrationError(`Invalid tool category: ${category}`);
    }

    return this.list({ category });
  }

  clear(): void {
    this.tools.clear();
  }
}
