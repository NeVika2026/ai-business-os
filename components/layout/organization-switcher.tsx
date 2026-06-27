'use client';

type OrganizationSwitcherProps = {
  organizationName: string;
};

export function OrganizationSwitcher({ organizationName }: OrganizationSwitcherProps) {
  return (
    <button
      type="button"
      disabled
      aria-label={`Organization: ${organizationName}`}
      title="Organization switching will be available soon"
      className="flex w-full items-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-0)] px-3 py-2 text-left text-sm text-[var(--text-primary)] opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:cursor-default"
    >
      <span aria-hidden="true" className="text-base">
        🏢
      </span>
      <span className="truncate font-medium">{organizationName}</span>
    </button>
  );
}
