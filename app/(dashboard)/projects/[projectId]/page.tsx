import { notFound, redirect } from 'next/navigation';

import { ProjectWorkspace } from '@/components/projects/ProjectWorkspace';
import { loadFactoryArtifacts } from '@/lib/factory-chain/persistence';
import { createClient } from '@/services/supabase/server';
import { getCurrentOrganizationId } from '@/utils/auth/organization';
import { loadProjectWorkspace } from '@/utils/projects/project-loader';
import { loadProjectMedia } from '@/utils/projects/project-media-loader';

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

  const [workspace, media, factoryArtifacts] = await Promise.all([
    loadProjectWorkspace(supabase, organizationId, projectId),
    loadProjectMedia(supabase, organizationId, projectId),
    loadFactoryArtifacts(projectId),
  ]);

  if (!workspace) {
    notFound();
  }

  return <ProjectWorkspace workspace={workspace} media={media} factoryArtifacts={factoryArtifacts} />;
}
