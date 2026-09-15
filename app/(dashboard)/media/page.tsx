import { redirect } from 'next/navigation';

import { MediaLibrary } from '@/components/media/MediaLibrary';
import { createClient } from '@/services/supabase/server';
import { getCurrentOrganizationId } from '@/utils/auth/organization';
import { loadMediaLibrary } from '@/utils/media/load-media-library';

type MediaPageProps = {
  searchParams: Promise<{ project?: string }>;
};

export default async function MediaPage({ searchParams }: MediaPageProps) {
  const { project } = await searchParams;
  const supabase = await createClient();
  const organizationId = await getCurrentOrganizationId(supabase);

  if (!organizationId) {
    redirect('/login');
  }

  const data = await loadMediaLibrary(supabase, organizationId);
  const initialProjectId =
    project && data.projects.some((item) => item.id === project) ? project : 'all';

  return <MediaLibrary data={data} initialProjectId={initialProjectId} />;
}
