export const USER_FACING_EXECUTION_STATUS = {
  preparing: 'Preparing your result…',
  working: 'Working on your request…',
} as const;

export const USER_FACING_EXECUTION_ERROR =
  'Не удалось подготовить результат. Попробуйте позже.' as const;

export {
  USER_FACING_GATEWAY_ERROR,
  USER_FACING_MEMORY_ERROR,
  USER_FACING_RUNTIME_ERROR,
  mapCaughtErrorToUserMessage,
  userFacingErrorMessage,
} from '@/lib/ai/user-facing-errors';
