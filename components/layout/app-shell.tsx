'use client';

import { useState } from 'react';

import { Sidebar } from '@/components/layout/sidebar';

type AppShellProps = {
  pathname: string;
  email: string;
  organizationName: string;
  header: React.ReactNode;
  children: React.ReactNode;
};

export function AppShell({ pathname, email, organizationName, header, children }: AppShellProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <div
      data-theme="dark"
      className="osa-workspace-surface flex min-h-screen bg-[var(--surface-0)] text-[var(--text-primary)]"
    >
      <Sidebar
        pathname={pathname}
        email={email}
        organizationName={organizationName}
        isDrawerOpen={isDrawerOpen}
        onCloseDrawer={() => setIsDrawerOpen(false)}
      />

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <div className="flex h-16 shrink-0 items-center gap-3 border-b border-[var(--border-subtle)] bg-[var(--surface-0)] px-4 lg:px-6">
          <button
            type="button"
            aria-label="Open navigation menu"
            onClick={() => setIsDrawerOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-[var(--text-primary)] hover:bg-[var(--surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] md:hidden"
          >
            <span aria-hidden="true" className="text-lg">
              ☰
            </span>
          </button>
          <div className="min-w-0 flex-1">{header}</div>
        </div>

        <main className="relative flex-1 overflow-y-auto p-5 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
