export function buildFirstResultGatewayPrompt(task: string): string {
  return `Ты — член моей команды в AI Business OS. Помоги мне сделать первый шаг.

Моя задача:
"${task}"

Ответь коротким планом действий в 4–6 пунктов, на русском языке, без технических терминов и без ссылок на модели ИИ.`;
}

export function buildFirstResultFallbackPlan(task: string): string {
  const focus = task.trim() || 'вашей задачи';

  return [
    'Начнём с простого.',
    'Сфокусируйтесь на одном понятном шаге на эту неделю.',
    '',
    `1. Сформулировать цель по задаче: «${focus}».`,
    '2. Выбрать один быстрый результат, который можно проверить за 1–2 дня.',
    '3. Решить, кто в команде ведёт первый этап.',
    '4. Сделать первый шаг и зафиксировать одну метрику.',
    '5. Вернуться завтра и скорректировать план по факту.',
    '',
    'Когда будете готовы — сохраните это и продолжите со мной.',
  ].join('\n');
}

export function buildWorkspaceTaskFallback(task: string, projectName: string): string {
  const focus = task.trim();
  const project = projectName.trim() || 'вашего проекта';

  return [
    `Я набросала первый шаг для ${project}.`,
    'Сейчас важнее ясности, чем скорости.',
    '',
    `Задача: ${focus}`,
    '',
    '1. Уточнить цель на ближайшие 7 дней.',
    '2. Выделить один результат, по которому будет виден прогресс.',
    '3. Сделать черновик и проверить гипотезу.',
    '4. Зафиксировать одну метрику успеха.',
    '5. Решить, что сделать следующим шагом.',
    '',
    'Можем продолжить вместе, когда будете готовы.',
  ].join('\n');
}

export function resolveFirstPlanContent(
  task: string,
  gatewayContent: string | null | undefined,
): { content: string; usedFallback: boolean } {
  const trimmed = gatewayContent?.trim();

  if (trimmed) {
    return { content: trimmed, usedFallback: false };
  }

  return {
    content: buildFirstResultFallbackPlan(task),
    usedFallback: true,
  };
}
