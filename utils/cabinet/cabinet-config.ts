export type SystemHealthStatus = 'healthy' | 'warning' | 'offline';

export type CabinetNavItem = {
  label: string;
  href: string;
  icon: string;
};

export type CabinetWidget = {
  id: string;
  title: string;
  description: string;
};

export type CabinetQuickAction = {
  id: string;
  label: string;
  href: string;
  icon: string;
};

export type CabinetModule = {
  id: string;
  label: string;
  href: string;
  icon: string;
  description: string;
  pinned?: boolean;
};

export type SystemHealthItem = {
  id: string;
  label: string;
  status: SystemHealthStatus;
};

export type ProfileMetric = {
  id: string;
  label: string;
};

export const CABINET_ROUTE = '/cabinet';

export const CABINET_NAVIGATION: CabinetNavItem[] = [
  { label: 'Home', href: '/home', icon: '🏠' },
  { label: 'Cabinet', href: '/cabinet', icon: '🧭' },
  { label: 'OSA', href: '/osa', icon: '✨' },
  { label: 'Workspace', href: '/workspace', icon: '🖥️' },
  { label: 'Projects', href: '/projects', icon: '📁' },
  { label: 'History', href: '/history', icon: '🕘' },
  { label: 'Settings', href: '/settings', icon: '⚙️' },
];

export const CABINET_WIDGETS: CabinetWidget[] = [
  { id: 'todays_activity', title: "Today's activity", description: 'Activity feed placeholder' },
  { id: 'running_ai_jobs', title: 'Running AI jobs', description: 'Active executions placeholder' },
  { id: 'recent_projects', title: 'Recent projects', description: 'Projects list placeholder' },
  {
    id: 'recent_executions',
    title: 'Recent executions',
    description: 'Execution history placeholder',
  },
  { id: 'quick_start', title: 'Quick Start', description: 'Onboarding shortcuts placeholder' },
  { id: 'pinned_modules', title: 'Pinned modules', description: 'Favorite modules placeholder' },
  { id: 'recent_documents', title: 'Recent documents', description: 'Documents list placeholder' },
  { id: 'upcoming_tasks', title: 'Upcoming tasks', description: 'Task queue placeholder' },
  { id: 'usage_statistics', title: 'Usage statistics', description: 'Usage metrics placeholder' },
  { id: 'ai_credits', title: 'AI credits', description: 'Credits balance placeholder' },
];

export const CABINET_QUICK_ACTIONS: CabinetQuickAction[] = [
  { id: 'new_project', label: 'New Project', href: '/projects', icon: '📁' },
  { id: 'run_osa', label: 'Run OSA', href: '/osa', icon: '✨' },
  { id: 'open_workspace', label: 'Open Workspace', href: '/workspace', icon: '🖥️' },
  { id: 'create_ai_team', label: 'Create AI Team', href: '/ai-employees', icon: '🤖' },
  { id: 'import_documents', label: 'Import Documents', href: '/knowledge', icon: '📄' },
  { id: 'connect_crm', label: 'Connect CRM', href: '/crm', icon: '👥' },
];

export const CABINET_MODULES: CabinetModule[] = [
  {
    id: 'osa',
    label: 'OSA',
    href: '/osa',
    icon: '✨',
    description: 'AI orchestrator',
    pinned: true,
  },
  { id: 'crm', label: 'CRM', href: '/crm', icon: '👥', description: 'Customer relationships' },
  {
    id: 'documents',
    label: 'Documents',
    href: '/knowledge',
    icon: '📄',
    description: 'Knowledge base',
  },
  {
    id: 'marketing',
    label: 'Marketing',
    href: '/marketplace',
    icon: '📣',
    description: 'Campaigns & outreach',
  },
  {
    id: 'analytics',
    label: 'Analytics',
    href: '/orchestrator',
    icon: '📊',
    description: 'Runs & insights',
  },
  {
    id: 'automation',
    label: 'Automation',
    href: '/orchestrator/runs',
    icon: '⚡',
    description: 'Workflow automation',
  },
  {
    id: 'knowledge',
    label: 'Knowledge',
    href: '/knowledge',
    icon: '📚',
    description: 'Sources & vault',
  },
  {
    id: 'estate',
    label: 'Estate',
    href: '/cabinet',
    icon: '🏢',
    description: 'Real estate module',
  },
  {
    id: 'mlm',
    label: 'MLM',
    href: '/cabinet',
    icon: '🔗',
    description: 'Network marketing module',
  },
  {
    id: 'finance',
    label: 'Finance',
    href: '/cabinet',
    icon: '💰',
    description: 'Financial operations',
  },
];

export const SYSTEM_HEALTH_ITEMS: SystemHealthItem[] = [
  { id: 'runtime', label: 'Runtime', status: 'healthy' },
  { id: 'gateway', label: 'Gateway', status: 'healthy' },
  { id: 'knowledge', label: 'Knowledge', status: 'warning' },
  { id: 'automation', label: 'Automation', status: 'healthy' },
  { id: 'memory', label: 'Memory', status: 'healthy' },
  { id: 'database', label: 'Database', status: 'healthy' },
];

export const PROFILE_METRICS: ProfileMetric[] = [
  { id: 'workspaces', label: 'Workspaces' },
  { id: 'projects', label: 'Projects' },
  { id: 'agents', label: 'AI agents' },
  { id: 'executions', label: 'Executions' },
];

export const CABINET_LAYOUT = {
  page: 'mx-auto w-full max-w-7xl space-y-6 px-1 sm:px-0',
  overviewGrid: 'grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-12 xl:gap-6',
  profileColumn: 'xl:col-span-3',
  mainColumn: 'space-y-4 sm:space-y-5 md:col-span-2 xl:col-span-6',
  sideColumn: 'space-y-4 sm:space-y-5 xl:col-span-3',
  widgetGrid: 'grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3',
  moduleGrid: 'grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
  quickActions: 'grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3',
  healthGrid: 'grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6',
  statsGrid: 'grid grid-cols-2 gap-3 sm:grid-cols-4',
} as const;

export const SYSTEM_HEALTH_LABELS: Record<SystemHealthStatus, string> = {
  healthy: 'Healthy',
  warning: 'Warning',
  offline: 'Offline',
};

export const SYSTEM_HEALTH_STYLES: Record<SystemHealthStatus, string> = {
  healthy: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700',
  warning: 'border-amber-500/30 bg-amber-500/10 text-amber-700',
  offline: 'border-red-500/30 bg-red-500/10 text-red-700',
};

export function getCabinetNavIndex(label: string): number {
  return CABINET_NAVIGATION.findIndex((item) => item.label === label);
}

export function isCabinetNavigationOrdered(): boolean {
  const labels = CABINET_NAVIGATION.map((item) => item.label);

  return (
    labels.indexOf('Dashboard') < labels.indexOf('Cabinet') &&
    labels.indexOf('Cabinet') < labels.indexOf('OSA')
  );
}
