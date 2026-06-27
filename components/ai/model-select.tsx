import type { AiModel } from '@/types/ai';

type ModelSelectProps = {
  models: AiModel[];
  providerId: string;
  value: string;
  onChange: (modelId: string) => void;
  name?: string;
  required?: boolean;
};

export function ModelSelect({
  models,
  providerId,
  value,
  onChange,
  name = 'model_id',
  required = true,
}: ModelSelectProps) {
  const filteredModels = models.filter(
    (model) => model.provider_id === providerId && model.is_active,
  );

  return (
    <label className="space-y-2">
      <span className="text-sm text-[var(--text-secondary)]">Model</span>
      <select
        name={name}
        value={value}
        required={required}
        disabled={!providerId}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-0)] px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
      >
        <option value="">{providerId ? 'Выберите модель' : 'Сначала выберите провайдера'}</option>
        {filteredModels.map((model) => (
          <option key={model.id} value={model.id}>
            {model.name}
          </option>
        ))}
      </select>
    </label>
  );
}
