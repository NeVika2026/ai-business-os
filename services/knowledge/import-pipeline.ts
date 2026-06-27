import type { KnowledgeImportStatus } from '@/types/knowledge';

export interface ImportPipelineContext {
  sourceId: string;
  organizationId: string;
}

export interface ImportPipelineStageResult {
  stage: KnowledgeImportStatus;
  success: boolean;
  message?: string;
}

export interface ImportPipeline {
  run(sourceId: string, organizationId: string): Promise<ImportPipelineStageResult[]>;
  enqueue(sourceId: string, organizationId: string): Promise<string>;
}

// TODO: wire ImportPipeline to queue and importer modules

export const importPipeline: ImportPipeline = {
  async run(_sourceId, _organizationId) {
    void _sourceId;
    void _organizationId;
    throw new Error('Import pipeline is not implemented yet');
  },
  async enqueue(_sourceId, _organizationId) {
    void _sourceId;
    void _organizationId;
    throw new Error('Import pipeline is not implemented yet');
  },
};

export interface KnowledgeImporter<TOptions = Record<string, unknown>> {
  type: string;
  import(options: TOptions): Promise<void>;
}
