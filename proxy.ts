import { type NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/services/supabase/middleware';
import { isProtectedPlatformPath } from '@/utils/security/protected-routes';

export async function proxy(request: NextRequest) {
  const { supabase, supabaseResponse } = createClient(request);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  supabaseResponse.headers.set('x-pathname', pathname);

  if (isProtectedPlatformPath(pathname) && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === '/login' && user) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = '/home';
    dashboardUrl.search = '';
    return NextResponse.redirect(dashboardUrl);
  }

  if (pathname === '/login/sign-in' && user) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = '/home';
    dashboardUrl.search = '';
    return NextResponse.redirect(dashboardUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/health|auth/callback|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|webm|ogg|ogv|mp3|wav|m4a)$).*)',
  ],
};
