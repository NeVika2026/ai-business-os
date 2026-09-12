'use client';

import { useFormStatus } from 'react-dom';
import { useEffect, type KeyboardEvent, type RefObject } from 'react';

type HeroPromptBoxProps = {
  value: string;
  onChange: (value: string) => void;
  inputAnchorRef?: RefObject<HTMLTextAreaElement | null>;
  submitAnchorRef?: RefObject<HTMLButtonElement | null>;
  onFocusChange?: (focused: boolean) => void;
  onSubmitHover?: (hovered: boolean) => void;
  onTypingChange?: (typing: boolean) => void;
  onSubmit?: () => void;
};

function resizeTextarea(element: HTMLTextAreaElement) {
  element.style.height = 'auto';
  const next = Math.min(element.scrollHeight, 160);
  element.style.height = `${Math.max(next, 68)}px`;
}

export function HeroPromptBox({
  value,
  onChange,
  inputAnchorRef,
  submitAnchorRef,
  onFocusChange,
  onSubmitHover,
  onTypingChange,
  onSubmit,
}: HeroPromptBoxProps) {
  const { pending } = useFormStatus();

  useEffect(() => {
    if (!pending) {
      return;
    }

    onSubmit?.();
  }, [onSubmit, pending]);

  useEffect(() => {
    const element = inputAnchorRef?.current;
    if (!element) {
      return;
    }

    resizeTextarea(element);
  }, [inputAnchorRef, value]);

  const hasText = value.trim().length > 0;

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter') {
      return;
    }

    if (event.shiftKey) {
      return;
    }

    event.preventDefault();

    if (!hasText || pending) {
      return;
    }

    onSubmit?.();
    event.currentTarget.form?.requestSubmit();
  };

  return (
    <div className="osa-login-prompt">
      <label className="sr-only" htmlFor="login-first-request">
        Первый запрос
      </label>
      <div
        className={`osa-login-prompt-box ${hasText ? 'osa-login-prompt-box--active' : ''}`}
      >
        <textarea
          ref={inputAnchorRef}
          id="login-first-request"
          name="task"
          rows={1}
          required
          value={value}
          disabled={pending}
          onChange={(event) => {
            onChange(event.target.value);
            onTypingChange?.(event.target.value.trim().length > 0);
            resizeTextarea(event.target);
          }}
          onFocus={() => onFocusChange?.(true)}
          onBlur={() => {
            onFocusChange?.(false);
            onTypingChange?.(false);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Опишите задачу своими словами…"
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
