import type { HomeWelcome } from '@/utils/home/home-types';

type WelcomeHeroProps = {
  welcome: HomeWelcome;
};

export function WelcomeHero({ welcome }: WelcomeHeroProps) {
  return (
    <header className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-5 sm:p-6">
      <p className="text-sm font-medium uppercase tracking-wide text-[var(--accent)]">
        Добро пожаловать
      </p>
      <h1 className="mt-2 text-2xl font-semibold text-[var(--text-primary)] sm:text-3xl">
        {welcome.userName}
      </h1>
      <div className="mt-3 flex flex-wrap gap-2 text-sm text-[var(--text-secondary)]">
        <span className="rounded-full bg-[var(--surface-2)] px-3 py-1">{welcome.organization}</span>
        <span className="rounded-full bg-[var(--surface-2)] px-3 py-1">
          Workspace: {welcome.workspace}
        </span>
      </div>
    </header>
  );
}
