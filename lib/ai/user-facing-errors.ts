export const USER_FACING_GATEWAY_ERROR =
  'OSA не смогла связаться с AI. Проверьте подключение и попробуйте снова.' as const;

export const USER_FACING_RUNTIME_ERROR =
  'Проект временно недоступен. Обновите страницу или вернитесь через минуту.' as const;

export const USER_FACING_MEMORY_ERROR =
  'Memory не ответила. OSA продолжит без сохранённого контекста — попробуйте ещё раз.' as const;

export const USER_FACING_GENERIC_ERROR =
  'Что-то пошло не так. OSA уже разбирается — попробуйте ещё раз.' as const;

export type UserFacingErrorKind = 'gateway' | 'runtime' | 'memory' | 'generic';

export function userFacingErrorMessage(kind: UserFacingErrorKind): string {
  switch (kind) {
    case 'gateway':
      return USER_FACING_GATEWAY_ERROR;
    case 'runtime':
      return USER_FACING_RUNTIME_ERROR;
    case 'memory':
      return USER_FACING_MEMORY_ERROR;
    default:
      return USER_FACING_GENERIC_ERROR;
  }
}

export function mapCaughtErrorToUserMessage(error: unknown, fallback: UserFacingErrorKind = 'generic'): string {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (message.includes('gateway') || message.includes('provider') || message.includes('timeout')) {
      return USER_FACING_GATEWAY_ERROR;
    }

    if (message.includes('runtime') || message.includes('project') || message.includes('orchestra')) {
      return USER_FACING_RUNTIME_ERROR;
    }

    if (message.includes('memory')) {
      return USER_FACING_MEMORY_ERROR;
    }
  }

  return userFacingErrorMessage(fallback);
}
