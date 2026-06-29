import type { ProjectMember } from '@/utils/projects/project-types';

type ProjectMembersProps = {
  members: ProjectMember[];
};

export function ProjectMembers({ members }: ProjectMembersProps) {
  return (
    <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4 sm:p-5">
      <header className="mb-4">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Members</h2>
      </header>

      {members.length === 0 ? (
        <p className="text-sm text-[var(--text-secondary)]">No organization members found.</p>
      ) : (
        <ul className="space-y-2">
          {members.map((member) => (
            <li
              key={member.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-0)] px-3 py-2"
            >
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">{member.name}</p>
                <p className="text-xs capitalize text-[var(--text-secondary)]">{member.role}</p>
              </div>
              {member.isOwner ? (
                <span className="rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
                  Owner
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
