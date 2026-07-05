import type { DeliverableType } from '@/types/deliverables';

export type DeliverableGenerationInput = {
  type: DeliverableType;
  projectName: string;
  projectDescription: string;
  agentRole: string;
  taskTitle: string;
};

export function buildDeliverableFallbackContent(input: DeliverableGenerationInput): {
  summary: string;
  content: string;
} {
  const context = [input.projectName, input.projectDescription].filter(Boolean).join(' — ');

  switch (input.type) {
    case 'landing':
      return {
        summary: `Landing page для «${input.projectName}»`,
        content: [
          `# ${input.projectName}`,
          '',
          '## Hero',
          `Операционная система, которая превращает «${input.taskTitle}» в результат за один день.`,
          '',
          '## Ценность',
          `- ${context}`,
          '- AI-команда работает параллельно',
          '- Executive Brain держит фокус CEO',
          '',
          '## CTA',
          'Начать с первого шага →',
        ].join('\n'),
      };

    case 'presentation':
      return {
        summary: `Презентация проекта «${input.projectName}»`,
        content: [
          `# Presentation — ${input.projectName}`,
          '',
          '## Слайд 1 — Проблема',
          context || input.taskTitle,
          '',
          '## Слайд 2 — Решение',
          `${input.agentRole} подготовил план: ${input.taskTitle}`,
          '',
          '## Слайд 3 — Следующий шаг',
          'Запустить первую итерацию и зафиксировать метрику успеха.',
        ].join('\n'),
      };

    case 'marketing_plan':
      return {
        summary: `Marketing Plan на 2 недели для «${input.projectName}»`,
        content: [
          `# Marketing Plan`,
          '',
          '## Цель',
          input.taskTitle,
          '',
          '## Аудитория',
          `- Контекст: ${context}`,
          '',
          '## Каналы',
          '- LinkedIn + email outreach',
          '- 2 поста в неделю',
          '- Одна landing-страница',
          '',
          '## Неделя 1',
          '1. Уточнить оффер\n2. Запустить черновик landing\n3. Первые 10 контактов',
        ].join('\n'),
      };

    case 'content_plan':
      return {
        summary: `Content Plan для «${input.projectName}»`,
        content: [
          `# Content Plan`,
          '',
          '## Тема недели',
          input.taskTitle,
          '',
          '## Форматы',
          '- 3 коротких поста',
          '- 1 длинный разбор',
          '- 1 email-рассылка',
          '',
          '## Черновики',
          `«${input.projectName}» — как мы двигаем ${input.taskTitle.toLowerCase()} без хаоса.`,
        ].join('\n'),
      };

    case 'sales_script':
      return {
        summary: `Sales Script для первых контактов`,
        content: [
          `# Sales Script`,
          '',
          '## Открытие',
          `Здравствуйте! Мы помогаем с «${input.taskTitle}» для проектов вроде ${input.projectName}.`,
          '',
          '## Вопрос',
          'Что сейчас мешает двигаться быстрее — ресурс команды или ясность следующего шага?',
          '',
          '## Закрытие',
          'Могу прислать короткий план на 15 минут — удобно на этой неделе?',
        ].join('\n'),
      };

    case 'business_strategy':
      return {
        summary: `Business Strategy для «${input.projectName}»`,
        content: [
          `# Business Strategy`,
          '',
          '## Фокус',
          input.taskTitle,
          '',
          '## Контекст',
          context,
          '',
          '## 30 дней',
          '1. Зафиксировать результат первой недели',
          '2. Запустить AI Orchestra на ключевых deliverables',
          '3. Принять одно решение CEO и сохранить в Executive Memory',
          '',
          '## Риск',
          'Распыление — держать один главный outcome до первого Ready.',
        ].join('\n'),
      };
  }
}

export function buildDeliverableGatewayPrompt(input: DeliverableGenerationInput): string {
  const typeLabel = input.type.replace(/_/g, ' ');

  return [
    `You are ${input.agentRole} preparing a ${typeLabel} deliverable for a business owner.`,
    'Write in clear Russian. No AI jargon. Usable today.',
    `Project: ${input.projectName}`,
    `Context: ${input.projectDescription || input.taskTitle}`,
    `Task: ${input.taskTitle}`,
    'Return markdown with ## sections. Start with one-sentence summary on first line after # Title.',
  ].join('\n');
}
