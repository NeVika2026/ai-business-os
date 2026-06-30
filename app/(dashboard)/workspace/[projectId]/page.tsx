import { notFound, redirect } from 'next/navigation';

import { OsaProjectWorkspace } from '@/components/workspace/OsaProjectWorkspace';
import { createClient } from '@/services/supabase/server';
import { getCurrentOrganizationId } from '@/utils/auth/organization';
import { loadOsaWorkspacePageData } from '@/utils/workspace/workspace-loader';

type ProjectWorkspacePageProps = {
  params: Promise<{ projectId: string }>;
};

export default async function ProjectWorkspacePage({ params }: ProjectWorkspacePageProps) {
  const { projectId } = await params;
  const supabase = await createClient();
  const organizationId = await getCurrentOrganizationId(supabase);

  if (!organizationId) {
    redirect('/login');
  }

  const data = await loadOsaWorkspacePageData(supabase, organizationId, projectId);

  if (!data) {
    notFound();
  }

  return <OsaProjectWorkspace data={data} />;
}
