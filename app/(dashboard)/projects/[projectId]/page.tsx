import { notFound, redirect } from 'next/navigation';

import { ProjectWorkspace } from '@/components/projects/ProjectWorkspace';
import { createClient } from '@/services/supabase/server';
import { getCurrentOrganizationId } from '@/utils/auth/organization';
import { loadProjectWorkspace } from '@/utils/projects/project-loader';

type ProjectDetailPageProps = {
  params: Promise<{ projectId: string }>;
};

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { projectId } = await params;
  const supabase = await createClient();
  const organizationId = await getCurrentOrganizationId(supabase);

  if (!organizationId) {
    redirect('/login');
  }

  const workspace = await loadProjectWorkspace(supabase, organizationId, projectId);

  if (!workspace) {
    notFound();
  }

  return <ProjectWorkspace workspace={workspace} />;
}
