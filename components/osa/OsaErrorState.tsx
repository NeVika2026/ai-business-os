type OsaErrorStateProps = {
  message: string;
  hint?: string;
  onRetry?: () => void;
  retryLabel?: string;
};

export function OsaErrorState({
  message,
  hint,
  onRetry,
  retryLabel = 'Попробовать снова',
}: OsaErrorStateProps) {
  return (
    <div
      className="rounded-[20px] border border-red-200/80 bg-red-50/50 px-5 py-4"
      role="alert"
      aria-live="polite"
    >
      <p className="text-[14px] font-medium leading-relaxed text-red-900">{message}</p>
      {hint ? <p className="mt-2 text-[14px] leading-relaxed text-red-800">{hint}</p> : null}
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 text-[13px] font-medium text-red-900 underline-offset-2 transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
        >
          {retryLabel}
        </button>
      ) : null}
    </div>
  );
}
