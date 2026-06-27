import type { KnowledgeImporter } from '@/services/knowledge/import-pipeline';

export interface ZipImportOptions {
  sourceId: string;
  organizationId: string;
  filePath?: string;
}

export class ZipImporter implements KnowledgeImporter<ZipImportOptions> {
  type = 'zip';

  async import(_options: ZipImportOptions): Promise<void> {
    void _options;
    // TODO: implement ZIP archive import pipeline
    throw new Error('ZipImporter is not implemented yet');
  }
}

export const zipImporter = new ZipImporter();
