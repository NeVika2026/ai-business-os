import { CABINET_NAVIGATION } from '@/utils/cabinet/cabinet-config';

export type NavItem = {
  label: string;
  href: string;
  icon: string;
};

export const MAIN_NAVIGATION: NavItem[] = CABINET_NAVIGATION.map((item) => ({
  label: item.label,
  href: item.href,
  icon: item.icon,
}));

export const NAVIGATION_HREF_SET = new Set(MAIN_NAVIGATION.map((item) => item.href));
