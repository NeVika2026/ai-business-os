import { toBusinessFactoryCorpusInputs } from '@/services/knowledge/business-factory-corpus';
import { createKnowledgePipeline } from '@/services/knowledge/knowledge-pipeline';
import {
  createRuntimeKnowledgeAdapter,
  type RuntimeKnowledgeAdapter,
} from '@/services/runtime/runtime-knowledge-adapter';

export function createBusinessFactoryRuntimeKnowledgeAdapter(
  instanceId: string,
): RuntimeKnowledgeAdapter {
  const pipeline = createKnowledgePipeline({
    instanceId: `${instanceId}-pipeline`,
  });

  const batch = pipeline.ingestDocuments(toBusinessFactoryCorpusInputs());

  if (batch.errors.length > 0) {
    const details = batch.errors.map((error) => `${error.source}: ${error.message}`).join('; ');
    throw new Error(`Business Factory knowledge seed failed: ${details}`);
  }

  return createRuntimeKnowledgeAdapter({
    instanceId,
    pipeline,
    contextLimit: 6,
  });
}
