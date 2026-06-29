import { redirect } from 'next/navigation';

import { ProjectList } from '@/components/projects/ProjectList';
import { createClient } from '@/services/supabase/server';
import { getCurrentOrganizationId } from '@/utils/auth/organization';
import { loadProjectList } from '@/utils/projects/project-loader';

export default async function ProjectsPage() {
  const supabase = await createClient();
  const organizationId = await getCurrentOrganizationId(supabase);

  if (!organizationId) {
    redirect('/login');
  }

  const data = await loadProjectList(supabase, organizationId);

  return <ProjectList data={data} />;
}
