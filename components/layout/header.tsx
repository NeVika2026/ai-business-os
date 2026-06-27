import { Breadcrumb } from '@/components/layout/breadcrumb';
import { UserAvatarButton } from '@/components/layout/user-menu';
import { buildBreadcrumbs } from '@/utils/navigation/breadcrumbs';

type HeaderProps = {
  pathname: string;
  email: string;
};

export function Header({ pathname, email }: HeaderProps) {
  const breadcrumbs = buildBreadcrumbs(pathname);

  return (
    <div className="flex items-center gap-4">
      <div className="min-w-0 flex-1">
        <Breadcrumb items={breadcrumbs} />
      </div>

      <div className="flex items-center gap-3">
        <label className="relative hidden sm:block">
          <span className="sr-only">Search</span>
          <input
            type="search"
            disabled
            placeholder="Search"
            aria-label="Search"
            className="w-40 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] px-3 py-2 text-sm text-[var(--text-secondary)] opacity-70 lg:w-56"
          />
        </label>

        <button
          type="button"
          disabled
          aria-label="Notifications"
          title="Notifications coming soon"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-[var(--text-secondary)] opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
          <span aria-hidden="true">🔔</span>
        </button>

        <UserAvatarButton email={email} />
      </div>
    </div>
  );
}
