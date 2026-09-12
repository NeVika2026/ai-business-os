'use client';

import { useRef } from 'react';

export type QuickAction = {
  id: string;
  label: string;
  text: string;
  icon: 'idea' | 'content' | 'analyze' | 'strategy';
};

export const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'idea',
    label: 'Придумать идею',
    text: 'Помоги придумать сильную идею для нового продукта',
    icon: 'idea',
  },
  {
    id: 'content',
    label: 'Создать контент',
    text: 'Создай контент под мою задачу',
    icon: 'content',
  },
  {
    id: 'analyze',
    label: 'Проанализировать',
    text: 'Проанализируй мою ситуацию и найди слабые места',
    icon: 'analyze',
  },
  {
    id: 'strategy',
    label: 'Собрать стратегию',
    text: 'Собери пошаговую стратегию достижения цели',
    icon: 'strategy',
  },
];

function QuickActionIcon({ type }: { type: QuickAction['icon'] }) {
  switch (type) {
    case 'idea':
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path
            d="M8 1.5c2.4 0 4.5 1.8 4.5 4.2 0 1.4-.7 2.6-1.7 3.4-.5.4-.8 1-.8 1.6V11H6v-.3c0-.6-.3-1.2-.8-1.6-1-1-1.7-2.1-1.7-3.4C3.5 3.3 5.6 1.5 8 1.5Z"
            stroke="currentColor"
            strokeWidth="1.2"
          />
          <path d="M6.5 12.5h3v1.2a.8.8 0 0 1-.8.8h-1.4a.8.8 0 0 1-.8-.8v-1.2Z" fill="currentColor" />
        </svg>
      );
    case 'content':
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <rect x="2.5" y="3" width="11" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
          <path d="M5 6.5h6M5 9h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );
    case 'analyze':
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M2.5 12.5 6 8.5l2.5 2.5L13.5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M10.5 5H13.5V8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );
    case 'strategy':
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.2" />
          <circle cx="8" cy="8" r="1.5" fill="currentColor" />
          <path d="M8 2.5V4M8 12v1.5M2.5 8H4M12 8h1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );
  }
}

type QuickActionsProps = {
  onSelect: (text: string) => void;
  onHoverChange?: (element: HTMLElement | null) => void;
};

export function QuickActions({ onSelect, onHoverChange }: QuickActionsProps) {
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  return (
    <div className="osa-login-quick-actions" role="group" aria-label="Быстрые действия">
      {QUICK_ACTIONS.map((action) => (
        <button
          key={action.id}
          type="button"
          className="osa-login-quick-action"
          ref={(node) => {
            buttonRefs.current[action.id] = node;
          }}
          onClick={() => onSelect(action.text)}
          onMouseEnter={() => onHoverChange?.(buttonRefs.current[action.id] ?? null)}
          onMouseLeave={() => onHoverChange?.(null)}
          onFocus={() => onHoverChange?.(buttonRefs.current[action.id] ?? null)}
          onBlur={() => onHoverChange?.(null)}
        >
          <span className="osa-login-quick-action-icon">
            <QuickActionIcon type={action.icon} />
          </span>
          <span>{action.label}</span>
        </button>
      ))}
    </div>
  );
}
