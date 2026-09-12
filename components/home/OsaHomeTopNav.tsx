'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import { OrbitMark } from '@/components/brand/OrbitMark';
import { UserAvatarButton } from '@/components/layout/user-menu';

const NAV_ITEMS = [
  { label: 'Создать', href: '/modules/create' },
  { label: 'Продвинуть', href: '/modules/promote' },
  { label: 'Проекты', href: '/projects' },
  { label: 'Магазин', href: '/marketplace' },
] as const;

type OsaHomeTopNavProps = {
  email: string;
};

export function OsaHomeTopNav({ email }: OsaHomeTopNavProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="osa-home-topnav">
      <div className="osa-home-topnav-inner">
        <Link href="/home" className="osa-home-topnav-brand" aria-label="Бизнес Завод">
          <OrbitMark size="sm" breathe className="osa-home-topnav-mark" />
          <span className="osa-home-topnav-wordmark">Бизнес Завод</span>
          <span className="hidden text-[10px] font-medium uppercase tracking-[0.18em] text-black/35 sm:inline">
            OSA inside
          </span>
        </Link>

        <nav className="osa-home-topnav-links" aria-label="Основная навигация">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`osa-home-topnav-link ${active ? 'osa-home-topnav-link--active' : ''}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="osa-home-topnav-actions">
          <button
            type="button"
            className="osa-home-topnav-menu-btn"
            aria-label="Меню"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span aria-hidden="true">{menuOpen ? '×' : '☰'}</span>
          </button>
          <UserAvatarButton email={email} />
        </div>
      </div>

      {menuOpen ? (
        <nav className="osa-home-topnav-drawer" aria-label="Мобильная навигация">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="osa-home-topnav-drawer-link"
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      ) : null}
    </header>
  );
}
