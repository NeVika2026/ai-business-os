import { NextResponse } from 'next/server';

import { createClient } from '@/services/supabase/server';
import { ensureUserOnboarding } from '@/utils/auth/onboarding';

function safeNextPath(value: string | null): string {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : '/home';
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = safeNextPath(searchParams.get('next'));

  if (!code) {
    return NextResponse.redirect(
      `${origin}/login/sign-in?error=auth&next=${encodeURIComponent(next)}`,
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      `${origin}/login/sign-in?error=auth&next=${encodeURIComponent(next)}`,
    );
  }

  try {
    await ensureUserOnboarding(supabase);
  } catch {
    return NextResponse.redirect(`${origin}/login/sign-in?error=auth`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
