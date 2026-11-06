import { NAVIGATION_HREF_SET } from '@/config/navigation';

const EXTRA_PROTECTED_PREFIXES = ['/cabinet'];

const PROTECTED_PREFIXES = [
  ...Array.from(NAVIGATION_HREF_SET),
  ...EXTRA_PROTECTED_PREFIXES,
];

export function isProtectedPlatformPath(pathname: string) {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
