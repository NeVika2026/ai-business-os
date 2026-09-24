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
  elevenLabsVoiceGenerateHandler,
  elevenLabsVoiceListHandler,
  elevenLabsVoiceStatusHandler,
  runwayAdLocalizationGenerateHandler,
  runwayImageGenerateHandler,
  runwayAvatarVideoGenerateHandler,
  runwayImageUpscaleHandler,
  runwaySoundEffectGenerateHandler,
  runwayVideoUpscaleHandler,
  runwayVideoEditHandler,
  runwayVideoExpandHandler,
  runwayMultiShotGenerateHandler,
  runwayProductAdGenerateHandler,
  runwayProductCampaignGenerateHandler,
  runwayProductUgcGenerateHandler,
  runwayTaskStatusHandler,
  runwayVideoGenerateHandler,
} from '@/services/runtime/tools/handlers/media-handler';
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
  'media.product_ad.generate': runwayProductAdGenerateHandler,
  'media.ad_localization.generate': runwayAdLocalizationGenerateHandler,
  'media.product_campaign.generate': runwayProductCampaignGenerateHandler,
  'media.multi_shot.generate': runwayMultiShotGenerateHandler,
  'media.product_ugc.generate': runwayProductUgcGenerateHandler,
  'media.video.generate': runwayVideoGenerateHandler,
  'media.image.generate': runwayImageGenerateHandler,
  'media.avatar_video.generate': runwayAvatarVideoGenerateHandler,
  'media.image.upscale': runwayImageUpscaleHandler,
  'media.sound_effect.generate': runwaySoundEffectGenerateHandler,
  'media.video.upscale': runwayVideoUpscaleHandler,
  'media.video.edit': runwayVideoEditHandler,
  'media.video.expand': runwayVideoExpandHandler,
  'media.runway.status': runwayTaskStatusHandler,
  'media.voice.list': elevenLabsVoiceListHandler,
  'media.voice.generate': elevenLabsVoiceGenerateHandler,
  'media.voice.status': elevenLabsVoiceStatusHandler,
};

export function attachProductionHandlers(tools: RegisteredToolInput[]): RegisteredToolInput[] {
  return tools.map((tool) => {
    const handler = PRODUCTION_HANDLERS[tool.id];
    return handler ? { ...tool, handler } : tool;
  });
}
