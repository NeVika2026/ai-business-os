'use client';

import { useEffect } from 'react';

import { logout } from '@/app/(dashboard)/actions';
import { OrganizationSwitcher } from '@/components/layout/organization-switcher';
import { UserMenu } from '@/components/layout/user-menu';
import { NavSection } from '@/components/navigation/nav-section';
import { MAIN_NAVIGATION } from '@/config/navigation';

type SidebarProps = {
  pathname: string;
  email: string;
  organizationName: string;
  isDrawerOpen: boolean;
  onCloseDrawer: () => void;
};

export function Sidebar({
  pathname,
  email,
  organizationName,
  isDrawerOpen,
  onCloseDrawer,
}: SidebarProps) {
  useEffect(() => {
    if (!isDrawerOpen) {
      return;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onCloseDrawer();
      }
    }

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isDrawerOpen, onCloseDrawer]);

  return (
    <>
      {isDrawerOpen ? (
        <button
          type="button"
          aria-label="Close navigation menu"
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onCloseDrawer}
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-[var(--border-subtle)] bg-[var(--surface-1)] transition-transform duration-200 md:static md:z-auto md:w-16 md:translate-x-0 md:transition-none lg:w-[280px] ${
          isDrawerOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
        aria-label="Sidebar"
      >
        <div className="flex h-16 items-center border-b border-[var(--border-subtle)] px-4 lg:px-5">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[var(--text-primary)] md:sr-only lg:not-sr-only">
              AI Business OS
            </p>
            <p
              aria-hidden="true"
              className="hidden text-sm font-semibold text-[var(--text-primary)] md:block lg:hidden"
            >
              AI
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4" onClick={onCloseDrawer}>
          <NavSection items={MAIN_NAVIGATION} pathname={pathname} />
        </div>

        <div className="space-y-3 border-t border-[var(--border-subtle)] p-3">
          <div className="md:sr-only lg:not-sr-only">
            <OrganizationSwitcher organizationName={organizationName} />
          </div>

          <div className="flex items-center justify-between gap-2 md:flex-col lg:flex-row">
            <UserMenu email={email} organizationName={organizationName} logoutAction={logout} />
            <form action={logout} className="w-full md:sr-only lg:not-sr-only">
              <button
                type="submit"
                aria-label="Logout"
                className="w-full rounded-lg border border-[var(--border-subtle)] px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              >
                Logout
              </button>
            </form>
          </div>
        </div>
      </aside>
    </>
  );
}
