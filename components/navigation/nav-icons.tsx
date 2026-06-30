import type { ReactElement, SVGProps } from 'react';

type NavIconName = 'today' | 'projects' | 'history' | 'settings';

type NavIconProps = SVGProps<SVGSVGElement> & {
  name: NavIconName;
};

function IconBase({ children, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

const ICONS: Record<NavIconName, (props: SVGProps<SVGSVGElement>) => ReactElement> = {
  today: (props) => (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5v4.5l3 1.5" />
    </IconBase>
  ),
  projects: (props) => (
    <IconBase {...props}>
      <rect x="4.5" y="6.5" width="15" height="12" rx="2" />
      <path d="M9 6.5V5.5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5.5v1" />
      <path d="M9 11.5h6" />
    </IconBase>
  ),
  history: (props) => (
    <IconBase {...props}>
      <path d="M6 8.5v8a2 2 0 0 0 2 2h8" />
      <path d="M8 6.5h7a2 2 0 0 1 2 2v7" />
      <path d="M9.5 14.5 12 12l2.5 2.5" />
    </IconBase>
  ),
  settings: (props) => (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="2.75" />
      <path d="M12 3.5v2M12 18.5v2M4.5 12h2M17.5 12h2M6.2 6.2l1.4 1.4M16.4 16.4l1.4 1.4M6.2 17.8l1.4-1.4M16.4 7.6l1.4-1.4" />
    </IconBase>
  ),
};

export function isNavIconName(value: string): value is NavIconName {
  return value in ICONS;
}

export function NavIcon({ name, className, ...props }: NavIconProps) {
  const Icon = ICONS[name];
  return <Icon className={className ?? 'h-[18px] w-[18px]'} {...props} />;
}
