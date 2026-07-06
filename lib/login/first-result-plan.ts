export function buildFirstResultGatewayPrompt(task: string): string {
  return `Ты — член моей команды в AI Business OS. Помоги мне сделать первый шаг.

Моя задача:
"${task}"

Ответь коротким планом действий в 4–6 пунктов, на русском языке, без технических терминов и без ссылок на модели ИИ.`;
}

export function buildFirstResultFallbackPlan(task: string): string {
  const focus = task.trim() || 'вашей задачи';

  return [
    'Вот с чего начать:',
    '',
    `1. Сформулировать цель на эту неделю по задаче: «${focus}».`,
    '2. Выбрать один быстрый результат, который можно проверить за 1–2 дня.',
    '3. Определить, кто в команде ведёт первый этап — анализ, контент или продажи.',
    '4. Запустить первый шаг и зафиксировать одну метрику успеха.',
    '5. Вернуться завтра и скорректировать план по факту.',
    '',
    'Следующее действие: открыть Workspace и выполнить пункт 1.',
  ].join('\n');
}

export function buildWorkspaceTaskFallback(task: string, projectName: string): string {
  const focus = task.trim();
  const project = projectName.trim() || 'проект';

  return [
    `Executive Brain подготовил первый шаг для «${project}».`,
    '',
    `Задача: ${focus}`,
    '',
    '1. Уточнить цель на ближайшие 7 дней.',
    '2. Выделить один deliverable с быстрым сигналом прогресса.',
    '3. Запустить AI Orchestra на анализ или черновик.',
    '4. Зафиксировать метрику успеха.',
    '5. Подтвердить следующий шаг в Workspace.',
    '',
    'Следующее действие: начать с пункта 1 сегодня.',
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
