import { type NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/services/supabase/middleware';
import { isProtectedPlatformPath } from '@/utils/security/protected-routes';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Preview deployments may not have Supabase credentials.
  // Public pages must remain readable, while private paths must stay protected.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    if (isProtectedPlatformPath(pathname)) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/login';
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }
    const publicResponse = NextResponse.next({ request });
    publicResponse.headers.set('x-pathname', pathname);
    return publicResponse;
  }

  const { supabase, supabaseResponse } = createClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
