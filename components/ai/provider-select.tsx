import type { AiProvider } from '@/types/ai';

type ProviderSelectProps = {
  providers: AiProvider[];
  value: string;
  onChange: (providerId: string) => void;
  name?: string;
  required?: boolean;
};

export function ProviderSelect({
  providers,
  value,
  onChange,
  name = 'provider_id',
  required = true,
}: ProviderSelectProps) {
  return (
    <label className="space-y-2">
      <span className="text-sm text-[var(--text-secondary)]">Provider</span>
      <select
        name={name}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-0)] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
      >
        <option value="">Выберите провайдера</option>
        {providers.map((provider) => (
          <option key={provider.id} value={provider.id}>
            {provider.name}
          </option>
        ))}
      </select>
    </label>
  );
}
