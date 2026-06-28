import Link from 'next/link';

import type { NotificationItem } from '@/utils/cabinet/dashboard-mappers';
import { formatDateTime } from '@/utils/orchestrator/runs';

type NotificationsPanelProps = {
  notifications: NotificationItem[];
};

export function NotificationsPanel({ notifications }: NotificationsPanelProps) {
  return (
    <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4 sm:p-5">
      <header className="mb-4">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Notifications</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">Latest unread platform events</p>
      </header>

      {notifications.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border-subtle)] bg-[var(--surface-0)] px-4 py-8 text-center">
          <p className="text-sm font-medium text-[var(--text-primary)]">No unread notifications</p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            New OSA, automation, and module events will appear here.
          </p>
        </div>
      ) : (
        <ol className="space-y-3">
          {notifications.map((notification) => (
            <li
              key={notification.id}
              className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-0)] px-4 py-3"
            >
              {notification.href ? (
                <Link href={notification.href} className="block hover:underline">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">
                    {notification.title}
                  </p>
                </Link>
              ) : (
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  {notification.title}
                </p>
              )}
              <p className="mt-1 text-xs text-[var(--text-secondary)]">{notification.body}</p>
              <time className="mt-2 block text-[10px] uppercase tracking-wide text-[var(--text-secondary)]">
                {formatDateTime(notification.timestamp)}
              </time>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
