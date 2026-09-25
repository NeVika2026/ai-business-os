import { BUSINESS_ZAVOD_NAVIGATION } from '@/utils/platform/business-zavod-config';

export type NavItem = {
  label: string;
  href: string;
  icon: string;
};

export const MAIN_NAVIGATION: NavItem[] = BUSINESS_ZAVOD_NAVIGATION.map((item) => ({
  label: item.label,
  href: item.href,
  icon: item.icon,
}));

export const NAVIGATION_HREF_SET = new Set(MAIN_NAVIGATION.map((item) => item.href));


export const ADMIN_ONLY_NAV_HREFS = new Set([
  '/settings',
  '/crm/import',
  '/crm/duplicates',
]);
