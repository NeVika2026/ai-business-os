import type { ToolHandlerContext } from '@/services/runtime/tools/tool-types';

export abstract class BaseToolHandler {
  abstract execute(
    args: Record<string, unknown>,
    ctx: ToolHandlerContext,
  ): Promise<Record<string, unknown>>;
}

export class RegistryStubHandler extends BaseToolHandler {
  async execute(): Promise<Record<string, unknown>> {
    throw new Error('Tool execution is not available in C5.1 registry-only mode');
  }
}

export const registryStubHandler = new RegistryStubHandler();
