import type { KnowledgeImportStatus } from '@/types/knowledge';

export interface KnowledgeProcessingJob {
  id: string;
  sourceId: string;
  organizationId: string;
  stage: KnowledgeImportStatus;
}

export interface KnowledgeProcessingQueue {
  enqueue(job: Omit<KnowledgeProcessingJob, 'id'>): Promise<string>;
  getStatus(jobId: string): Promise<KnowledgeProcessingJob | null>;
  cancel(jobId: string): Promise<void>;
}

// TODO: implement queue-backed knowledge processing worker

/** @deprecated Stub — not implemented. Use KnowledgePipeline instead. */
export const knowledgeProcessingQueue: KnowledgeProcessingQueue = {
  async enqueue(_job) {
    void _job;
    throw new Error('Knowledge processing queue is not implemented yet');
  },
  async getStatus(_jobId) {
    void _jobId;
    throw new Error('Knowledge processing queue is not implemented yet');
  },
  async cancel(_jobId) {
    void _jobId;
    throw new Error('Knowledge processing queue is not implemented yet');
  },
};
