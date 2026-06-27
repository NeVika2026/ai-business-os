'use client';

import { useEffect, useId, useRef, useState } from 'react';

type UserMenuProps = {
  email: string;
  organizationName: string;
  logoutAction: () => void | Promise<void>;
};

function getInitials(email: string) {
  const local = email.split('@')[0] ?? 'U';
  return local.slice(0, 2).toUpperCase();
}

export function UserMenu({ email, organizationName, logoutAction }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label="User menu"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent-soft)] text-xs font-semibold text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
      >
        {getInitials(email)}
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label="User menu"
          className="absolute bottom-full right-0 z-50 mb-2 w-64 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-0)] p-3 shadow-lg"
        >
          <div className="space-y-1 border-b border-[var(--border-subtle)] pb-3">
            <p className="truncate text-sm font-medium text-[var(--text-primary)]">{email}</p>
            <p className="truncate text-xs text-[var(--text-secondary)]">{organizationName}</p>
          </div>
          <form action={logoutAction} className="pt-3" role="none">
            <button
              type="submit"
              role="menuitem"
              aria-label="Logout"
              className="w-full rounded-lg px-3 py-2 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            >
              Logout
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}

export function UserAvatarButton({ email }: { email: string }) {
  const initials = getInitials(email);

  return (
    <div
      aria-hidden="true"
      className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent-soft)] text-xs font-semibold text-[var(--accent)]"
    >
      {initials}
    </div>
  );
}
