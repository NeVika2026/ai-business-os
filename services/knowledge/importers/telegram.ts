import type { KnowledgeSourceImporter } from '@/services/knowledge/import-pipeline';

export interface TelegramImportOptions {
  sourceId: string;
  organizationId: string;
  exportPath?: string;
}

/** @deprecated Stub — not implemented. Use KnowledgePipeline instead. */
export class TelegramImporter implements KnowledgeSourceImporter<TelegramImportOptions> {
  type = 'telegram';

  async import(_options: TelegramImportOptions): Promise<void> {
    void _options;
    // TODO: implement Telegram export import pipeline
    throw new Error('TelegramImporter is not implemented yet');
  }
}

/** @deprecated Stub — not implemented. Use KnowledgePipeline instead. */
export const telegramImporter = new TelegramImporter();
