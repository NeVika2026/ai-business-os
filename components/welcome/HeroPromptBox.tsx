'use client';

import { useFormStatus } from 'react-dom';
import { useEffect, type RefObject } from 'react';

type HeroPromptBoxProps = {
  value: string;
  onChange: (value: string) => void;
  inputAnchorRef?: RefObject<HTMLTextAreaElement | null>;
  submitAnchorRef?: RefObject<HTMLButtonElement | null>;
  onFocusChange?: (focused: boolean) => void;
  onSubmitHover?: (hovered: boolean) => void;
  onSubmit?: () => void;
};

export function HeroPromptBox({
  value,
  onChange,
  inputAnchorRef,
  submitAnchorRef,
  onFocusChange,
  onSubmitHover,
  onSubmit,
}: HeroPromptBoxProps) {
  const { pending } = useFormStatus();

  useEffect(() => {
    if (!pending) {
      return;
    }

    onSubmit?.();
  }, [onSubmit, pending]);

  const hasText = value.trim().length > 0;

  return (
    <div className="osa-login-prompt">
      <label className="sr-only" htmlFor="login-first-request">
        Первый запрос
      </label>
      <div className={`osa-login-prompt-box ${hasText ? 'osa-login-prompt-box--active' : ''}`}>
        <textarea
          ref={inputAnchorRef}
          id="login-first-request"
          name="task"
          rows={2}
          required
          value={value}
          disabled={pending}
          onChange={(event) => onChange(event.target.value)}
          onFocus={() => onFocusChange?.(true)}
          onBlur={() => onFocusChange?.(false)}
          placeholder="Опиши, что ты хочешь создать, улучшить или решить..."
          className="osa-login-prompt-input"
        />
        <button
          ref={submitAnchorRef}
          type="submit"
          disabled={!hasText || pending}
          aria-label="Отправить запрос"
          className={`osa-login-prompt-submit ${hasText ? 'osa-login-prompt-submit--ready' : ''}`}
          onMouseEnter={() => onSubmitHover?.(true)}
          onMouseLeave={() => onSubmitHover?.(false)}
          onFocus={() => onSubmitHover?.(true)}
          onBlur={() => onSubmitHover?.(false)}
        >
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  );
}
