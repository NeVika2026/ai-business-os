import Link from 'next/link';

type NavItemProps = {
  label: string;
  href: string;
  icon: string;
  isActive: boolean;
};

export function NavItem({ label, href, icon, isActive }: NavItemProps) {
  return (
    <Link
      href={href}
      aria-label={label}
      aria-current={isActive ? 'page' : undefined}
      title={label}
      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-1)] md:justify-center md:px-2 lg:justify-start lg:px-3 ${
        isActive
          ? 'bg-[var(--accent-soft)] font-medium text-[var(--accent)]'
          : 'text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]'
      }`}
    >
      <span aria-hidden="true" className="shrink-0 text-base leading-none">
        {icon}
      </span>
      <span className="truncate md:sr-only lg:not-sr-only lg:inline">{label}</span>
    </Link>
  );
}
