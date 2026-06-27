import type { KnowledgeImporter } from '@/services/knowledge/import-pipeline';

export interface WebsiteImportOptions {
  sourceId: string;
  organizationId: string;
  url: string;
}

export class WebsiteImporter implements KnowledgeImporter<WebsiteImportOptions> {
  type = 'website';

  async import(_options: WebsiteImportOptions): Promise<void> {
    void _options;
    // TODO: implement website crawl/import pipeline
    throw new Error('WebsiteImporter is not implemented yet');
  }
}

export const websiteImporter = new WebsiteImporter();
