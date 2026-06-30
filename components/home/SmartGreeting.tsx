import type { SmartGreetingData } from '@/utils/home/wow-engine';

const TODAY_PRIORITY_LINE = 'Today starts with one clear priority.';

type SmartGreetingProps = {
  greeting: SmartGreetingData;
};

export function SmartGreeting({ greeting }: SmartGreetingProps) {
  return (
    <header className="space-y-4" aria-labelledby="today-briefing-heading">
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--text-secondary)]">
        Today
      </p>

      <p className="text-base font-normal text-[var(--text-secondary)] sm:text-lg">
        {greeting.salutation}, {greeting.userName}.
      </p>

      <h1
        id="today-briefing-heading"
        className="max-w-2xl text-3xl font-semibold leading-[1.15] tracking-tight text-[var(--text-primary)] sm:text-4xl"
      >
        {greeting.headline}
      </h1>

      <p className="max-w-xl text-sm leading-relaxed text-[var(--text-secondary)] sm:text-base">
        {TODAY_PRIORITY_LINE}
      </p>
    </header>
  );
}
