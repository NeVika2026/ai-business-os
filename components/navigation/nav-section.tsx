import type { NavItem as NavItemConfig } from '@/config/navigation';

import { NavItem } from './nav-item';

type NavSectionProps = {
  items: NavItemConfig[];
  pathname: string;
};

export function NavSection({ items, pathname }: NavSectionProps) {
  return (
    <nav aria-label="Main navigation" className="flex flex-col gap-1 px-3">
      {items.map((item) => (
        <NavItem
          key={item.href}
          label={item.label}
          href={item.href}
          icon={item.icon}
          isActive={pathname === item.href || pathname.startsWith(`${item.href}/`)}
        />
      ))}
    </nav>
  );
}
