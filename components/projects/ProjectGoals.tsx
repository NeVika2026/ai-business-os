type ProjectGoalsProps = {
  goals: string[];
};

export function ProjectGoals({ goals }: ProjectGoalsProps) {
  return (
    <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4 sm:p-5">
      <header className="mb-4">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Goals</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Parsed from project description bullet points
        </p>
      </header>

      {goals.length === 0 ? (
        <p className="text-sm text-[var(--text-secondary)]">
          Add goals as bullet points in the project description.
        </p>
      ) : (
        <ul className="space-y-2">
          {goals.map((goal) => (
            <li
              key={goal}
              className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-0)] px-3 py-2 text-sm text-[var(--text-primary)]"
            >
              {goal}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
