import { CABINET_LAYOUT, CABINET_WIDGETS } from '@/utils/cabinet/cabinet-config';

const ACTIVITY_WIDGET_IDS = new Set([
  'todays_activity',
  'running_ai_jobs',
  'recent_projects',
  'recent_executions',
  'recent_documents',
  'upcoming_tasks',
]);

export function RecentActivity() {
  const widgets = CABINET_WIDGETS.filter((widget) => ACTIVITY_WIDGET_IDS.has(widget.id));

  return (
    <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4 sm:p-5">
      <header className="mb-4">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Recent Activity</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Live feed placeholders for jobs, projects, and executions
        </p>
      </header>

      <div className={CABINET_LAYOUT.widgetGrid}>
        {widgets.map((widget) => (
          <article
            key={widget.id}
            className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-0)] p-4"
          >
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">{widget.title}</h3>
            <p className="mt-2 text-xs text-[var(--text-secondary)]">{widget.description}</p>
            <p className="mt-3 text-sm font-medium text-[var(--text-primary)]">—</p>
          </article>
        ))}
      </div>
    </section>
  );
}
