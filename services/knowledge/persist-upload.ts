import type { SupabaseClient } from '@supabase/supabase-js';

import { createKnowledgeChunkEngine } from '@/services/knowledge/knowledge-chunk-engine';
import {
  extractKnowledgeDocuments,
  type ExtractedKnowledgeDocument,
} from '@/services/knowledge/file-extraction';

type PersistUploadInput = {
  supabase: SupabaseClient;
  organizationId: string;
  userId: string;
  sourceId: string;
  storagePath: string;
  filename: string;
  mimeType: string | null;
};

export type PersistUploadResult = {
  sourceId: string;
  documentCount: number;
  chunkCount: number;
};

const CHUNK_BATCH_SIZE = 100;

function chunkRowsForDocument(input: {
  organizationId: string;
  sourceId: string;
  itemId: string;
  document: ExtractedKnowledgeDocument;
  positionOffset: number;
}) {
  const engine = createKnowledgeChunkEngine({
    instanceId: 'knowledge-import-' + input.itemId,
    minTokens: 250,
    maxTokens: 700,
  });

  const chunks = engine.chunkDocument({
    documentId: input.itemId,
    source: input.document.sourcePath,
    title: input.document.title,
    tags: [],
    sections: [
      {
        heading: input.document.title,
        level: 1,
        text: input.document.content,
      },
    ],
  });

  return chunks.map((chunk, index) => ({
    organization_id: input.organizationId,
    source_id: input.sourceId,
    item_id: input.itemId,
    content: chunk.text,
    token_count: chunk.metadata.tokenCount,
    position: input.positionOffset + index,
    metadata: {
      section: chunk.metadata.section,
      source_path: input.document.sourcePath,
      tags: chunk.metadata.tags,
    },
  }));
}

async function updateSourceStatus(
  supabase: SupabaseClient,
  organizationId: string,
  sourceId: string,
  values: Record<string, unknown>,
) {
  const { error } = await supabase
    .from('knowledge_sources')
    .update(values)
    .eq('id', sourceId)
    .eq('organization_id', organizationId);

  if (error) {
    throw error;
  }
}

async function insertChunks(supabase: SupabaseClient, rows: Array<Record<string, unknown>>) {
  for (let index = 0; index < rows.length; index += CHUNK_BATCH_SIZE) {
    const batch = rows.slice(index, index + CHUNK_BATCH_SIZE);
    const { error } = await supabase.from('knowledge_chunks').insert(batch);
    if (error) {
      throw error;
    }
  }
}

export async function persistUploadedKnowledge(
  input: PersistUploadInput,
): Promise<PersistUploadResult> {
  const { data: download, error: downloadError } = await input.supabase.storage
    .from('knowledge-files')
    .download(input.storagePath);

  if (downloadError || !download) {
    throw downloadError ?? new Error('Не удалось скачать файл из хранилища.');
  }

  const bytes = Buffer.from(await download.arrayBuffer());

  await updateSourceStatus(input.supabase, input.organizationId, input.sourceId, {
    status: 'parsing',
    error_message: null,
  });

  const documents = await extractKnowledgeDocuments({
    filename: input.filename,
    mimeType: input.mimeType,
    bytes,
  });

  await updateSourceStatus(input.supabase, input.organizationId, input.sourceId, {
    status: 'chunking',
  });

  const allChunkRows: Array<Record<string, unknown>> = [];
  let chunkOffset = 0;

  for (let position = 0; position < documents.length; position += 1) {
    const document = documents[position];
    const { data: item, error: itemError } = await input.supabase
      .from('knowledge_items')
      .insert({
        organization_id: input.organizationId,
        source_id: input.sourceId,
        type: 'document',
        title: document.title,
        content: document.content,
        position,
        created_by: input.userId,
        metadata: {
          ...document.metadata,
          source_path: document.sourcePath,
        },
      })
      .select('id')
      .single();

    if (itemError || !item) {
      throw itemError ?? new Error('Не удалось сохранить документ базы знаний.');
    }

    const chunkRows = chunkRowsForDocument({
      organizationId: input.organizationId,
      sourceId: input.sourceId,
      itemId: item.id,
      document,
      positionOffset: chunkOffset,
    });

    allChunkRows.push(...chunkRows);
    chunkOffset += chunkRows.length;
  }

  await insertChunks(input.supabase, allChunkRows);

  await updateSourceStatus(input.supabase, input.organizationId, input.sourceId, {
    status: 'completed',
    items_count: documents.length,
    chunks_count: allChunkRows.length,
    error_message: null,
    completed_at: new Date().toISOString(),
  });

  return {
    sourceId: input.sourceId,
    documentCount: documents.length,
    chunkCount: allChunkRows.length,
  };
}

export async function failUploadedKnowledge(input: {
  supabase: SupabaseClient;
  organizationId: string;
  sourceId: string;
  message: string;
}) {
  await input.supabase
    .from('knowledge_items')
    .delete()
    .eq('source_id', input.sourceId)
    .eq('organization_id', input.organizationId);

  await input.supabase
    .from('knowledge_sources')
    .update({
      status: 'failed',
      error_message: input.message.slice(0, 2000),
      items_count: 0,
      chunks_count: 0,
      completed_at: null,
    })
    .eq('id', input.sourceId)
    .eq('organization_id', input.organizationId);
}
