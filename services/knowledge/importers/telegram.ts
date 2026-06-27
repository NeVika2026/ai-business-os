import type { KnowledgeImporter } from '@/services/knowledge/import-pipeline';

export interface TelegramImportOptions {
  sourceId: string;
  organizationId: string;
  exportPath?: string;
}

export class TelegramImporter implements KnowledgeImporter<TelegramImportOptions> {
  type = 'telegram';

  async import(_options: TelegramImportOptions): Promise<void> {
    void _options;
    // TODO: implement Telegram export import pipeline
    throw new Error('TelegramImporter is not implemented yet');
  }
}

export const telegramImporter = new TelegramImporter();
