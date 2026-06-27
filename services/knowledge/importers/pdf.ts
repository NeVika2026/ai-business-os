import type { KnowledgeImporter } from '@/services/knowledge/import-pipeline';

export interface PdfImportOptions {
  sourceId: string;
  organizationId: string;
  filePath?: string;
}

export class PdfImporter implements KnowledgeImporter<PdfImportOptions> {
  type = 'pdf';

  async import(_options: PdfImportOptions): Promise<void> {
    void _options;
    // TODO: implement PDF import pipeline
    throw new Error('PdfImporter is not implemented yet');
  }
}

export const pdfImporter = new PdfImporter();
