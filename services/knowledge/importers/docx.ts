import type { KnowledgeSourceImporter } from '@/services/knowledge/import-pipeline';

export interface DocxImportOptions {
  sourceId: string;
  organizationId: string;
  filePath?: string;
}

/** @deprecated Stub — not implemented. Use KnowledgePipeline instead. */
export class DocxImporter implements KnowledgeSourceImporter<DocxImportOptions> {
  type = 'docx';

  async import(_options: DocxImportOptions): Promise<void> {
    void _options;
    // TODO: implement DOCX import pipeline
    throw new Error('DocxImporter is not implemented yet');
  }
}

/** @deprecated Stub — not implemented. Use KnowledgePipeline instead. */
export const docxImporter = new DocxImporter();
