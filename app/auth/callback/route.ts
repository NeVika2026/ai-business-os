import { NextResponse } from 'next/server';

import { createClient } from '@/services/supabase/server';
import { ensureUserOnboarding } from '@/utils/auth/onboarding';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (!code) {
    return NextResponse.redirect(`${origin}/login/sign-in?error=auth`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/login/sign-in?error=auth`);
  }

  try {
    await ensureUserOnboarding(supabase);
  } catch {
    return NextResponse.redirect(`${origin}/login/sign-in?error=auth`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
