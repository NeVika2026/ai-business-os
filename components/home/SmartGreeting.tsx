import type { SmartGreetingData } from '@/utils/home/wow-engine';

const TODAY_PRIORITY_LINE = 'Today starts with one clear priority.';

type SmartGreetingProps = {
  greeting: SmartGreetingData;
};

export function SmartGreeting({ greeting }: SmartGreetingProps) {
  return (
    <header className="wow-fade-in space-y-3" aria-labelledby="today-briefing-heading">
      <p className="text-sm font-medium uppercase tracking-wide text-[var(--accent)]">Today</p>

      <p className="text-base font-medium text-[var(--text-primary)] sm:text-lg">
        {greeting.salutation}, {greeting.userName}.
      </p>

      <h1
        id="today-briefing-heading"
        className="text-2xl font-semibold leading-snug text-[var(--text-primary)] sm:text-3xl"
      >
        {greeting.headline}
      </h1>

      <p className="text-sm text-[var(--text-secondary)]">{TODAY_PRIORITY_LINE}</p>
    </header>
  );
}
