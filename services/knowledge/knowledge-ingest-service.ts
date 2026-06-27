import { KnowledgeIngestServiceValidationError } from '@/services/knowledge/knowledge-ingest-service-errors';
import { serializeKnowledgeIngestServiceSnapshot } from '@/services/knowledge/knowledge-ingest-service-serializer';
import type {
  KnowledgeIngestDocumentsResult,
  KnowledgeIngestErrorEntry,
  KnowledgeIngestMarkdownResult,
  KnowledgeIngestReindexResult,
  KnowledgeIngestServiceOptions,
  KnowledgeIngestServiceSnapshot,
  KnowledgeIngestStatistics,
  KnowledgeIngestVaultResult,
  SerializedKnowledgeIngestServiceSnapshot,
  VaultDocument,
} from '@/services/knowledge/knowledge-ingest-service-types';
import {
  createKnowledgePipeline,
  type KnowledgePipeline,
} from '@/services/knowledge/knowledge-pipeline';
import type { KnowledgePipelineIngestMarkdownInput } from '@/services/knowledge/knowledge-pipeline-types';
import {
  createKnowledgeVaultLoader,
  type KnowledgeVaultLoader,
} from '@/services/knowledge/knowledge-vault-loader';

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function createEmptyStatistics(): KnowledgeIngestStatistics {
  return {
    documents: 0,
    chunks: 0,
    headings: 0,
    links: 0,
    tags: 0,
    indexSize: 0,
    duration: 0,
    errors: 0,
  };
}

function vaultDocumentToPipelineInput(
  document: VaultDocument,
): KnowledgePipelineIngestMarkdownInput {
  return {
    content: document.content,
    title: document.title,
    path: document.path,
    source: `${document.vaultPath}:${document.relativePath}`,
    tags: [...document.tags],
    metadata: {
      ...document.metadata,
      vaultDocumentId: document.id,
      vaultPath: document.vaultPath,
      relativePath: document.relativePath,
      extension: document.extension,
      format: document.format,
      wikilinks: [...document.wikilinks],
      sizeBytes: document.sizeBytes,
      loadedAt: document.loadedAt,
    },
  };
}

function toIngestError(
  source: string,
  path: string | null,
  message: string,
): KnowledgeIngestErrorEntry {
  return {
    source,
    path,
    message,
  };
}

/**
 * Connects Vault Loader output to the Knowledge Pipeline end-to-end.
 */
export class KnowledgeIngestService {
  private lastVaultPath: string | null = null;
  private lastOperation: KnowledgeIngestServiceSnapshot['lastOperation'] = null;
  private lastIngestAt: string | null = null;
  private lastStatistics: KnowledgeIngestStatistics = createEmptyStatistics();
  private updatedAt = new Date().toISOString();

  constructor(
    private readonly instanceId: string,
    private readonly pipeline: KnowledgePipeline,
    private readonly vaultLoader: KnowledgeVaultLoader,
  ) {}

  async ingestVault(vaultPath: string): Promise<KnowledgeIngestVaultResult> {
    if (!isNonEmptyString(vaultPath)) {
      throw new KnowledgeIngestServiceValidationError('vault path is required');
    }

    const startedAt = Date.now();
    const loadResult = await this.vaultLoader.loadVault(vaultPath);
    const loadErrors = loadResult.errors.map((error) =>
      toIngestError(error.path, error.path, error.message),
    );
    const ingestResult = this.ingestDocuments(loadResult.documents);
    const errors = [...loadErrors, ...ingestResult.errors];
    const statistics = this.buildStatistics(Date.now() - startedAt, errors.length);

    this.lastVaultPath = loadResult.vaultPath;
    this.lastOperation = 'ingestVault';
    this.lastIngestAt = new Date().toISOString();
    this.lastStatistics = statistics;
    this.updatedAt = this.lastIngestAt;

    return {
      vaultPath: loadResult.vaultPath,
      ingestedDocuments: ingestResult.ingestedDocuments,
      results: ingestResult.results,
      errors,
      statistics,
    };
  }

  ingestDocuments(documents: VaultDocument[]): KnowledgeIngestDocumentsResult {
    if (!Array.isArray(documents)) {
      throw new KnowledgeIngestServiceValidationError('documents must be an array');
    }

    const startedAt = Date.now();
    const inputs = documents.map(vaultDocumentToPipelineInput);
    const batch = this.pipeline.ingestDocuments(inputs);
    const errors = batch.errors.map((error) =>
      toIngestError(error.source, error.source, error.message),
    );
    const statistics = this.buildStatistics(Date.now() - startedAt, errors.length);

    this.lastOperation = 'ingestDocuments';
    this.lastIngestAt = new Date().toISOString();
    this.lastStatistics = statistics;
    this.updatedAt = this.lastIngestAt;

    if (documents.length > 0) {
      this.lastVaultPath = documents[0]?.vaultPath ?? this.lastVaultPath;
    }

    return {
      ingestedDocuments: batch.results.length,
      results: batch.results,
      errors,
      statistics,
    };
  }

  ingestMarkdown(markdown: string, source?: string): KnowledgeIngestMarkdownResult {
    if (!isNonEmptyString(markdown)) {
      throw new KnowledgeIngestServiceValidationError('markdown content is required');
    }

    const startedAt = Date.now();
    const input: KnowledgePipelineIngestMarkdownInput = {
      content: markdown,
      source: source?.trim() || 'inline-markdown',
    };
    const batch = this.pipeline.ingestDocuments([input]);
    const errors = batch.errors.map((error) => toIngestError(error.source, null, error.message));
    const statistics = this.buildStatistics(Date.now() - startedAt, errors.length);

    this.lastOperation = 'ingestMarkdown';
    this.lastIngestAt = new Date().toISOString();
    this.lastStatistics = statistics;
    this.updatedAt = this.lastIngestAt;

    return {
      result: batch.results[0] ?? null,
      errors,
      statistics,
    };
  }

  reindex(): KnowledgeIngestReindexResult {
    const startedAt = Date.now();
    const batch = this.pipeline.reindex();
    const errors = batch.errors.map((error) => toIngestError(error.source, null, error.message));
    const statistics = this.buildStatistics(Date.now() - startedAt, errors.length);

    this.lastOperation = 'reindex';
    this.lastIngestAt = new Date().toISOString();
    this.lastStatistics = statistics;
    this.updatedAt = this.lastIngestAt;

    return {
      reindexedDocuments: batch.results.length,
      results: batch.results,
      errors,
      statistics,
    };
  }

  statistics(): KnowledgeIngestStatistics {
    return this.buildStatistics(this.lastStatistics.duration, this.lastStatistics.errors);
  }

  serialize(): SerializedKnowledgeIngestServiceSnapshot {
    return serializeKnowledgeIngestServiceSnapshot({
      snapshot: this.buildSnapshot(),
      pipeline: this.pipeline.serialize(),
      vaultLoader: this.vaultLoader.serialize(),
    });
  }

  reset(): void {
    this.pipeline.reset();
    this.vaultLoader.reset();
    this.lastVaultPath = null;
    this.lastOperation = null;
    this.lastIngestAt = null;
    this.lastStatistics = createEmptyStatistics();
    this.updatedAt = new Date().toISOString();
  }

  getInstanceId(): string {
    return this.instanceId;
  }

  private buildStatistics(duration: number, errors: number): KnowledgeIngestStatistics {
    const pipelineStatistics = this.pipeline.statistics();
    const ingestMetrics = this.pipeline.getIngestMetrics();
    const indexSnapshot = this.pipeline.serialize().index;

    return {
      documents: pipelineStatistics.documentCount,
      chunks: pipelineStatistics.chunkCount,
      headings: ingestMetrics.headings,
      links: ingestMetrics.links,
      tags: ingestMetrics.tags,
      indexSize: indexSnapshot.entryCount,
      duration,
      errors,
    };
  }

  private buildSnapshot(): KnowledgeIngestServiceSnapshot {
    return {
      instanceId: this.instanceId,
      lastVaultPath: this.lastVaultPath,
      lastOperation: this.lastOperation,
      lastIngestAt: this.lastIngestAt,
      statistics: this.buildStatistics(0, this.lastStatistics.errors),
      updatedAt: this.updatedAt,
    };
  }
}

export function createKnowledgeIngestService(
  options?: KnowledgeIngestServiceOptions,
): KnowledgeIngestService {
  const instanceId = options?.instanceId?.trim() || 'default-knowledge-ingest-service';
  const pipeline =
    options?.pipeline ?? createKnowledgePipeline({ instanceId: `${instanceId}-pipeline` });
  const vaultLoader =
    options?.vaultLoader ??
    createKnowledgeVaultLoader({ instanceId: `${instanceId}-vault-loader` });

  return new KnowledgeIngestService(instanceId, pipeline, vaultLoader);
}

/** Default dev/test singleton. Vault-to-pipeline ingest orchestrator. */
export const knowledgeIngestService = createKnowledgeIngestService();
