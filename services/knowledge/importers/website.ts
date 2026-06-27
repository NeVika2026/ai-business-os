import type { KnowledgeSourceImporter } from '@/services/knowledge/import-pipeline';

export interface WebsiteImportOptions {
  sourceId: string;
  organizationId: string;
  url: string;
}

/** @deprecated Stub — not implemented. Use KnowledgePipeline instead. */
export class WebsiteImporter implements KnowledgeSourceImporter<WebsiteImportOptions> {
  type = 'website';

  async import(_options: WebsiteImportOptions): Promise<void> {
    void _options;
    // TODO: implement website crawl/import pipeline
    throw new Error('WebsiteImporter is not implemented yet');
  }
}

/** @deprecated Stub — not implemented. Use KnowledgePipeline instead. */
export const websiteImporter = new WebsiteImporter();
