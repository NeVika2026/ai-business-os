import { BaseToolHandler } from '@/services/runtime/tools/handlers/base-handler';
import type { ToolHandlerContext } from '@/services/runtime/tools/tool-types';

const RUNTIME_VERSION = '1.0.0';

export class RuntimeInfoHandler extends BaseToolHandler {
  async execute(
    _args: Record<string, unknown>,
    ctx: ToolHandlerContext,
  ): Promise<Record<string, unknown>> {
    return {
      runtimeVersion: RUNTIME_VERSION,
      runId: ctx.runId,
      employeeId: ctx.employeeId,
      organizationId: ctx.organizationId,
    };
  }
}

export const runtimeInfoHandler = new RuntimeInfoHandler();
