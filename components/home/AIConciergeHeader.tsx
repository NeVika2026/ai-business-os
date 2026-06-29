import type { ConciergeGreeting } from '@/utils/home/concierge-mappers';

type AIConciergeHeaderProps = {
  greeting: ConciergeGreeting;
};

export function AIConciergeHeader({ greeting }: AIConciergeHeaderProps) {
  return (
    <header className="space-y-1">
      <h1 className="text-2xl font-semibold text-[var(--text-primary)] sm:text-3xl">
        {greeting.salutation}, {greeting.userName}
      </h1>
      <p className="text-sm text-[var(--text-secondary)]">{greeting.organization}</p>
    </header>
  );
}
