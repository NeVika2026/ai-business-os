import type { KnowledgeSourceImporter } from '@/services/knowledge/import-pipeline';

export interface PdfImportOptions {
  sourceId: string;
  organizationId: string;
  filePath?: string;
}

/** @deprecated Stub — not implemented. Use KnowledgePipeline instead. */
export class PdfImporter implements KnowledgeSourceImporter<PdfImportOptions> {
  type = 'pdf';

  async import(_options: PdfImportOptions): Promise<void> {
    void _options;
    // TODO: implement PDF import pipeline
    throw new Error('PdfImporter is not implemented yet');
  }
}

/** @deprecated Stub — not implemented. Use KnowledgePipeline instead. */
export const pdfImporter = new PdfImporter();
