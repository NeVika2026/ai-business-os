import type { RuntimeKnowledgeAdapter } from '@/services/runtime/runtime-knowledge-adapter';

type HydrateOrganizationKnowledgeInput = {
  adapter: RuntimeKnowledgeAdapter;
  organizationId: string;
  query: string;
  projectId?: string | null;
  maxItems?: number;
};

type KnowledgeItemRow = {
  id: string;
  source_id: string;
  project_id: string | null;
  title: string;
  content: string | null;
  metadata: Record<string, unknown> | null;
  updated_at: string;
};

function tokenize(value: string): string[] {
  return value
    .toLocaleLowerCase('ru-RU')
    .replace(/ё/g, 'е')
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 2);
}

function scoreItem(item: KnowledgeItemRow, terms: string[]): number {
  if (terms.length === 0) {
    return 1;
  }

  const title = item.title.toLocaleLowerCase('ru-RU').replace(/ё/g, 'е');
  const sample = (item.content ?? '')
    .slice(0, 80_000)
    .toLocaleLowerCase('ru-RU')
    .replace(/ё/g, 'е');

  let score = 0;
  for (const term of terms) {
    if (title.includes(term)) score += 4;
    if (sample.includes(term)) score += 1;
  }

  return score;
}

function metadataTags(metadata: Record<string, unknown> | null): string[] {
  const raw = metadata?.tags;
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.filter((value): value is string => typeof value === 'string' && value.trim().length > 0);
}

export async function hydrateOrganizationKnowledge(
  input: HydrateOrganizationKnowledgeInput,
): Promise<number> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return 0;
  }

  try {
    const { createClient } = await import('@/services/supabase/server');
    const supabase = await createClient();

    let sourceQuery = supabase
      .from('knowledge_sources')
      .select('id')
      .eq('organization_id', input.organizationId)
      .eq('status', 'completed')
      .limit(500);

    if (input.projectId) {
      sourceQuery = sourceQuery.or('project_id.is.null,project_id.eq.' + input.projectId);
    }

    const { data: sources, error: sourceError } = await sourceQuery;
    if (sourceError || !sources || sources.length === 0) {
      return 0;
    }

    const sourceIds = sources.map((source) => source.id);
    let itemQuery = supabase
      .from('knowledge_items')
      .select('id, source_id, project_id, title, content, metadata, updated_at')
      .eq('organization_id', input.organizationId)
      .in('source_id', sourceIds)
      .not('content', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(250);

    if (input.projectId) {
      itemQuery = itemQuery.or('project_id.is.null,project_id.eq.' + input.projectId);
    }

    const { data: items, error: itemError } = await itemQuery;
    if (itemError || !items || items.length === 0) {
      return 0;
    }

    const terms = [...new Set(tokenize(input.query))].slice(0, 40);
    const maxItems = Math.min(Math.max(input.maxItems ?? 24, 1), 40);
    const selected = (items as KnowledgeItemRow[])
      .map((item) => ({ item, score: scoreItem(item, terms) }))
      .filter((entry) => entry.score > 0 || terms.length === 0)
      .sort((left, right) => {
        if (right.score !== left.score) return right.score - left.score;
        return right.item.updated_at.localeCompare(left.item.updated_at);
      })
      .slice(0, maxItems);

    for (const { item } of selected) {
      const content = item.content?.trim();
      if (!content) {
        continue;
      }

      input.adapter.ingestMarkdown({
        title: item.title,
        source: 'knowledge-db:' + item.source_id + ':' + item.id,
        content: content.slice(0, 500_000),
        tags: metadataTags(item.metadata),
        metadata: {
          sourceId: item.source_id,
          itemId: item.id,
          projectId: item.project_id,
          persistent: true,
        },
      });
    }

    return selected.length;
  } catch {
    // Persistent knowledge is additive. A database lookup failure must not block OSA execution.
    return 0;
  }
}
