import { redirect } from 'next/navigation';

import { SourceTable } from '@/components/knowledge/source-table';
import { createClient } from '@/services/supabase/server';
import { getCurrentOrganizationId } from '@/utils/auth/organization';
import { mapKnowledgeSources, SOURCE_SELECT } from '@/utils/knowledge/sources';

export default async function KnowledgeSourcesPage() {
  const supabase = await createClient();
  const organizationId = await getCurrentOrganizationId(supabase);

  if (!organizationId) {
    redirect('/login');
  }

  const { data, error } = await supabase
    .from('knowledge_sources')
    .select(SOURCE_SELECT)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  const sources = mapKnowledgeSources(data ?? []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Источники</h1>
        <p className="text-sm text-[var(--text-secondary)]">Все источники знаний организации</p>
      </div>
      <SourceTable sources={sources} showHeader={false} />
    </div>
  );
}
