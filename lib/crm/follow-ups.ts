export class FollowUpError extends Error {}

export const MANUAL_FOLLOW_UP_MARKER = 'CRM_FOLLOWUP_MANUAL';

export type CrmFollowUp = {
  id: string;
  dueAt: string;
  description: string | null;
};

export function followUpLeadId(description: string | null | undefined) {
  return description?.split('\n')[0].match(/^CRM_LEAD_ID:([^\s]+)$/)?.[1] ?? null;
}

export function followUpNote(description: string | null | undefined) {
  return (description ?? '')
    .split('\n')
    .slice(1)
    .filter((line) => line !== MANUAL_FOLLOW_UP_MARKER && line !== 'CRM follow-up')
    .join('\n')
    .trim();
}

// Run in the click handler so calendar days and 11:00 use the device time zone.
export function followUpPreset(days: 1 | 3 | 7, now: Date) {
  if (![1, 3, 7].includes(days)) throw new FollowUpError('Выберите срок: 1, 3 или 7 дней.');
  const date = new Date(now);
  date.setDate(date.getDate() + days);
  date.setHours(11, 0, 0, 0);
  return date.toISOString();
}

export function toLocalDateTime(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '';
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function validateFollowUpDate(value: string, now: Date) {
  if (typeof value !== 'string' || !/(?:Z|[+-]\d{2}:\d{2})$/i.test(value)) {
    throw new FollowUpError('Выберите дату и время напоминания.');
  }
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) throw new FollowUpError('Некорректная дата напоминания.');
  if (date.getTime() <= now.getTime()) throw new FollowUpError('Выберите время в будущем.');
  return date.toISOString();
}
