import { formatProjectDate } from '@/utils/projects/project-mappers';
import type { ProjectActivityItem } from '@/utils/projects/project-types';

type ProjectActivityProps = {
  activity: ProjectActivityItem[];
};

export function ProjectActivity({ activity }: ProjectActivityProps) {
  return (
    <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4 sm:p-5">
      <header className="mb-4">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Activity</h2>
      </header>

      {activity.length === 0 ? (
        <p className="text-sm text-[var(--text-secondary)]">No recent project activity.</p>
      ) : (
        <ul className="space-y-3">
          {activity.map((item) => (
            <li
              key={item.id}
              className="flex items-start justify-between gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-0)] px-3 py-2"
            >
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">{item.title}</p>
                <p className="text-xs text-[var(--text-secondary)]">{item.category}</p>
              </div>
              <time className="shrink-0 text-xs text-[var(--text-secondary)]">
                {formatProjectDate(item.timestamp)}
              </time>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
