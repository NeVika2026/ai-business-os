import { createClient } from '@/services/supabase/server';

export async function hasAuthenticatedMediaUser(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return Boolean(user);
}
