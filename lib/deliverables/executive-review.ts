import type {
  DeliverableType,
  ExecutiveReview,
  ExecutiveReviewConfidence,
  ProjectDeliverable,
} from '@/types/deliverables';
import { DELIVERABLE_TYPE_LABELS } from '@/lib/deliverables/deliverable-catalog';

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function countSections(content: string): number {
  return content.split('\n').filter((line) => line.trim().startsWith('##')).length;
}

function scoreFromContent(content: string, type: DeliverableType): number {
  const sections = countSections(content);
  const length = content.trim().length;
  let score = 58;

  score += Math.min(sections * 8, 24);
  score += Math.min(Math.floor(length / 120), 18);

  if (type === 'landing' && /CTA|cta|→/.test(content)) {
    score += 6;
  }

  if (type === 'sales_script' && /Здравствуйте|Hi /.test(content)) {
    score += 5;
  }

  return clampScore(score);
}

function confidenceFromScore(score: number): ExecutiveReviewConfidence {
  if (score >= 78) {
    return 'high';
  }

  if (score >= 62) {
    return 'medium';
  }

  return 'low';
}

function strengthsFor(type: DeliverableType, content: string): string[] {
  const typeLabel = DELIVERABLE_TYPE_LABELS[type];
  const items = [`Структура ${typeLabel} понятна CEO с первого просмотра.`];

  if (countSections(content) >= 3) {
    items.push('Есть чёткие секции — результат можно использовать по частям.');
  } else {
    items.push('Фокус на одном outcome без лишнего шума.');
  }

  if (content.length > 280) {
    items.push('Достаточно деталей для первого рабочего черновика.');
  } else {
    items.push('Краткий формат — легко доработать за один проход.');
  }

  return items.slice(0, 3);
}

function weaknessesFor(type: DeliverableType, score: number): string[] {
  const items: string[] = [];

  if (score < 70) {
    items.push('CTA и следующий шаг можно сделать конкретнее.');
  }

  if (type === 'landing') {
    items.push('Hero-блок можно усилить одним числовым proof point.');
  } else if (type === 'marketing_plan') {
    items.push('Каналы стоит привязать к одной метрике недели.');
  } else {
    items.push('Нужен один явный KPI для проверки результата.');
  }

  if (items.length < 2) {
    items.push('Формулировки benefit-first можно усилить.');
  }

  return items.slice(0, 2);
}

function recommendationsFor(type: DeliverableType): string[] {
  switch (type) {
    case 'landing':
      return ['Добавить один social proof.', 'Сократить hero до одного предложения.'];
    case 'presentation':
      return ['Вынести решение на второй слайд.', 'Закончить одним CTA.'];
    case 'marketing_plan':
      return ['Зафиксировать одну метрику недели.', 'Выбрать один главный канал.'];
    case 'content_plan':
      return ['Привязать темы к одной воронке.', 'Добавить один long-form формат.'];
    case 'sales_script':
      return ['Сократить opening до двух предложений.', 'Добавить один уточняющий вопрос.'];
    case 'business_strategy':
      return ['Сфокусировать 30 дней на одном outcome.', 'Явно назвать главный риск.'];
  }
}

function nextActionFor(deliverable: Pick<ProjectDeliverable, 'type' | 'title' | 'taskTitle'>): string {
  switch (deliverable.type) {
    case 'landing':
      return 'Опубликовать hero и CTA на landing — проверить первый клик.';
    case 'presentation':
      return 'Провести 15-минутный walkthrough по слайдам с командой.';
    case 'marketing_plan':
      return 'Запустить первый канал из плана на этой неделе.';
    case 'content_plan':
      return 'Опубликовать первый пост из Content Plan сегодня.';
    case 'sales_script':
      return 'Отправить Sales Script пяти целевым контактам.';
    case 'business_strategy':
      return `Зафиксировать первый шаг: ${deliverable.taskTitle}.`;
  }
}

export function buildExecutiveReview(
  deliverable: Pick<
    ProjectDeliverable,
    'type' | 'title' | 'content' | 'summary' | 'taskTitle' | 'agentRole'
  >,
): ExecutiveReview {
  const score = scoreFromContent(deliverable.content, deliverable.type);
  const confidence = confidenceFromScore(score);

  return {
    score,
    confidence,
    strengths: strengthsFor(deliverable.type, deliverable.content),
    weaknesses: weaknessesFor(deliverable.type, score),
    recommendations: recommendationsFor(deliverable.type),
    nextAction: nextActionFor(deliverable),
    reviewedAt: new Date().toISOString(),
  };
}

export function confidenceLabel(confidence: ExecutiveReviewConfidence): string {
  switch (confidence) {
    case 'low':
      return 'Low';
    case 'medium':
      return 'Medium';
    case 'high':
      return 'High';
  }
}

export function reviewScoreAfterImprove(previousScore: number, version: number): number {
  const bump = version >= 3 ? 12 : 8;

  return clampScore(previousScore + bump);
}
