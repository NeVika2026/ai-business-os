import type { KnowledgeSourceImporter } from '@/services/knowledge/import-pipeline';

export interface ZipImportOptions {
  sourceId: string;
  organizationId: string;
  filePath?: string;
}

/** @deprecated Stub — not implemented. Use KnowledgePipeline instead. */
export class ZipImporter implements KnowledgeSourceImporter<ZipImportOptions> {
  type = 'zip';

  async import(_options: ZipImportOptions): Promise<void> {
    void _options;
    // TODO: implement ZIP archive import pipeline
    throw new Error('ZipImporter is not implemented yet');
  }
}

/** @deprecated Stub — not implemented. Use KnowledgePipeline instead. */
export const zipImporter = new ZipImporter();
