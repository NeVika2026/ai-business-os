import { MAIN_NAVIGATION } from '@/config/navigation';

export type BreadcrumbItem = {
  label: string;
  href: string;
};

const NAV_BY_HREF = new Map(MAIN_NAVIGATION.map((item) => [item.href, item.label]));

function formatSegment(segment: string) {
  return segment
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function buildBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) {
    return [{ label: 'Dashboard', href: '/dashboard' }];
  }

  const crumbs: BreadcrumbItem[] = [];
  let path = '';

  for (const segment of segments) {
    path += `/${segment}`;
    crumbs.push({
      label: NAV_BY_HREF.get(path) ?? formatSegment(segment),
      href: path,
    });
  }

  return crumbs;
}
