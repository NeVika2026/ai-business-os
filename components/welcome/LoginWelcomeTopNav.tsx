'use client';

import Link from 'next/link';
import { useState } from 'react';

export function LoginWelcomeTopNav() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="osa-login-topnav">
      <div className="osa-login-topnav-inner">
        <Link href="/login" className="osa-login-topnav-brand" aria-label="OSA">
          OSA
        </Link>

        <div className="osa-login-topnav-actions">
          <Link href="/login/sign-in" className="osa-login-topnav-signin">
            Войти
          </Link>
          <button
            type="button"
            className="osa-login-topnav-menu"
            aria-label="Меню"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="osa-login-topnav-menu-bar" aria-hidden="true" />
            <span className="osa-login-topnav-menu-bar" aria-hidden="true" />
            <span className="osa-login-topnav-menu-bar" aria-hidden="true" />
          </button>
        </div>
      </div>

      {menuOpen ? (
        <nav className="osa-login-topnav-drawer" aria-label="Меню">
          <Link href="/login/sign-in" className="osa-login-topnav-drawer-link" onClick={() => setMenuOpen(false)}>
            Войти
          </Link>
          <Link href="/home" className="osa-login-topnav-drawer-link" onClick={() => setMenuOpen(false)}>
            Рабочее пространство
          </Link>
        </nav>
      ) : null}
    </header>
  );
}
