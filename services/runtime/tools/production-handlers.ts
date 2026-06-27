import {
  crmCreateHandler,
  crmSearchHandler,
  crmUpdateHandler,
} from '@/services/runtime/tools/handlers/crm-handler';
import {
  emailSendHandler,
  filesListHandler,
  filesReadHandler,
  mcpCallHandler,
  telegramSendHandler,
  webSearchHandler,
} from '@/services/runtime/tools/handlers/integration-handler';
import { knowledgeSearchHandler } from '@/services/runtime/tools/handlers/knowledge-handler';
import {
  automationStatusHandler,
  diagnosticsRuntimeHandler,
  gatewayHealthHandler,
  gatewayModelsHandler,
  healthCheckHandler,
  memorySearchHandler,
} from '@/services/runtime/tools/handlers/runtime-tools-handler';
import { runtimeInfoHandler } from '@/services/runtime/tools/handlers/system-handler';
import type { RegisteredToolInput } from '@/services/runtime/tools/tool-types';
import type { BaseToolHandler } from '@/services/runtime/tools/handlers/base-handler';

const PRODUCTION_HANDLERS: Record<string, BaseToolHandler> = {
  'runtime.info': runtimeInfoHandler,
  'knowledge.search': knowledgeSearchHandler,
  'memory.search': memorySearchHandler,
  'gateway.health': gatewayHealthHandler,
  'gateway.models': gatewayModelsHandler,
  'health.check': healthCheckHandler,
  'diagnostics.runtime': diagnosticsRuntimeHandler,
  'automation.status': automationStatusHandler,
  'crm.search': crmSearchHandler,
  'crm.create': crmCreateHandler,
  'crm.update': crmUpdateHandler,
  'web.search': webSearchHandler,
  'email.send': emailSendHandler,
  'telegram.send': telegramSendHandler,
  'mcp.call': mcpCallHandler,
  'files.read': filesReadHandler,
  'files.list': filesListHandler,
};

export function attachProductionHandlers(tools: RegisteredToolInput[]): RegisteredToolInput[] {
  return tools.map((tool) => {
    const handler = PRODUCTION_HANDLERS[tool.id];
    return handler ? { ...tool, handler } : tool;
  });
}
