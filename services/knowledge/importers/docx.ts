import type { KnowledgeImporter } from '@/services/knowledge/import-pipeline';

export interface DocxImportOptions {
  sourceId: string;
  organizationId: string;
  filePath?: string;
}

export class DocxImporter implements KnowledgeImporter<DocxImportOptions> {
  type = 'docx';

  async import(_options: DocxImportOptions): Promise<void> {
    void _options;
    // TODO: implement DOCX import pipeline
    throw new Error('DocxImporter is not implemented yet');
  }
}

export const docxImporter = new DocxImporter();
