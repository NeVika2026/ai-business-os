export type NavItem = {
  label: string;
  href: string;
  icon: string;
};

export const MAIN_NAVIGATION: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: '🏠' },
  { label: 'CRM', href: '/crm', icon: '👥' },
  { label: 'Projects', href: '/projects', icon: '📁' },
  { label: 'Knowledge', href: '/knowledge', icon: '📚' },
  { label: 'AI Employees', href: '/ai-employees', icon: '🤖' },
  { label: 'Marketplace', href: '/marketplace', icon: '🛒' },
  { label: 'Academy', href: '/academy', icon: '🎓' },
  { label: 'Settings', href: '/settings', icon: '⚙️' },
];

export const NAVIGATION_HREF_SET = new Set(MAIN_NAVIGATION.map((item) => item.href));
