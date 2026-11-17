import { NAVIGATION_HREF_SET } from '@/config/navigation';

// All dashboard-only routes must redirect before server components construct a
// Supabase client. The public course page remains /kursy-nejrosetey.
const EXTRA_PROTECTED_PREFIXES = [
  '/academy',
  '/ai-employees',
  '/cabinet',
  '/dashboard',
  '/factories',
  '/gallery',
  '/history',
  '/marketplace',
  '/orchestrator',
  '/osa',
  '/results',
  '/tools',
  '/workspace',
];

const PROTECTED_PREFIXES = [...Array.from(NAVIGATION_HREF_SET), ...EXTRA_PROTECTED_PREFIXES];

export function isProtectedPlatformPath(pathname: string) {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
