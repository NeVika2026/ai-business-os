import { redirect } from 'next/navigation';

import { MediaLibrary } from '@/components/media/MediaLibrary';
import { createClient } from '@/services/supabase/server';
import { getCurrentOrganizationId } from '@/utils/auth/organization';
import { loadMediaLibrary } from '@/utils/media/load-media-library';

export default async function MediaPage() {
  const supabase = await createClient();
  const organizationId = await getCurrentOrganizationId(supabase);

  if (!organizationId) {
    redirect('/login');
  }

  const data = await loadMediaLibrary(supabase, organizationId);

  return <MediaLibrary data={data} />;
}
