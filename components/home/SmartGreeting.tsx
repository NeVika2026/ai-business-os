'use client';

import type { SmartGreetingData } from '@/utils/home/wow-engine';

type SmartGreetingProps = {
  greeting: SmartGreetingData;
};

export function SmartGreeting({ greeting }: SmartGreetingProps) {
  return (
    <header className="wow-fade-in space-y-2">
      <h1 className="text-2xl font-semibold text-[var(--text-primary)] sm:text-3xl">
        {greeting.salutation}, {greeting.userName}.
      </h1>
      <p className="text-base text-[var(--text-secondary)]">{greeting.headline}</p>
    </header>
  );
}
