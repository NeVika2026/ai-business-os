import Link from 'next/link';

import type { SmartSuggestion } from '@/utils/home/home-types';

type SmartSuggestionsProps = {
  suggestions: SmartSuggestion[];
};

export function SmartSuggestions({ suggestions }: SmartSuggestionsProps) {
  return (
    <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4 sm:p-5">
      <header className="mb-4">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Smart suggestions</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Based on recent activity, executions, and projects
        </p>
      </header>

      {suggestions.length === 0 ? (
        <p className="text-sm text-[var(--text-secondary)]">No suggestions yet.</p>
      ) : (
        <ul className="space-y-2">
          {suggestions.map((suggestion) => (
            <li key={suggestion.id}>
              <Link
                href={suggestion.href}
                className="block rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-0)] px-3 py-2 transition hover:border-[var(--accent)]"
              >
                <p className="text-sm font-medium text-[var(--text-primary)]">{suggestion.title}</p>
                <p className="text-xs text-[var(--text-secondary)]">{suggestion.description}</p>
                <p className="mt-1 text-[10px] uppercase tracking-wide text-[var(--accent)]">
                  {suggestion.reason}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
