import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  analyzeNavigatorInput,
  buildNavigatorRecommendation,
  scoreNavigatorTeams,
  type NavigatorTeamCategory,
} from '@/utils/osa/navigator-engine';

type Scenario = {
  name: string;
  input: string;
  primaryIncludes?: NavigatorTeamCategory[];
  tagsInclude?: string;
  minConfidence?: number;
  maxConfidence?: number;
  needsReview?: boolean;
  secondaryExpected?: boolean;
};

const SCENARIOS: Scenario[] = [
  {
    name: 'real estate broker acquisition',
    input: 'Я инвест-брокер и хочу больше клиентов по новостройкам',
    primaryIncludes: ['Sales', 'Marketing', 'Research'],
    minConfidence: 55,
  },
  {
    name: 'dentist whatsapp overload',
    input: 'Я стоматолог и устал отвечать в WhatsApp',
    primaryIncludes: ['Support'],
    tagsInclude: 'pain:inbox-overload',
    minConfidence: 55,
  },
  {
    name: 'mlm recruiting automation',
    input: 'Я сетевик и хочу автоматизировать рекрутинг',
    primaryIncludes: ['Automation'],
    tagsInclude: 'profession:network-marketing',
    minConfidence: 55,
  },
  {
    name: 'factory operations automation',
    input: 'Я директор завода и хочу сократить рутину',
    primaryIncludes: ['Automation', 'Operations'],
    tagsInclude: 'profession:manufacturing',
    minConfidence: 55,
  },
  {
    name: 'content plan for telegram',
    input: 'Нужен контент-план для telegram и reels на месяц',
    primaryIncludes: ['Content'],
    tagsInclude: 'goal:content',
    minConfidence: 55,
  },
  {
    name: 'marketing campaign launch',
    input: 'Запустить рекламную кампанию в VK и привлечь лиды',
    primaryIncludes: ['Marketing'],
    tagsInclude: 'deliverable:campaign',
    minConfidence: 55,
  },
  {
    name: 'crm funnel for sales team',
    input: 'Нужна CRM воронка и карточки клиентов для отдела продаж',
    primaryIncludes: ['Sales'],
    tagsInclude: 'deliverable:crm',
    minConfidence: 55,
  },
  {
    name: 'analytics dashboard request',
    input: 'Собери KPI, метрики и дашборд эффективности маркетинга',
    primaryIncludes: ['Analytics'],
    tagsInclude: 'goal:analytics',
    minConfidence: 55,
  },
  {
    name: 'development integration',
    input: 'Нужна разработка API интеграции и бота для сайта',
    primaryIncludes: ['Development'],
    tagsInclude: 'deliverable:development',
    minConfidence: 55,
  },
  {
    name: 'market research',
    input: 'Проведи исследование рынка и конкурентов в нише',
    primaryIncludes: ['Research'],
    minConfidence: 50,
  },
  {
    name: 'urgent support backlog',
    input: 'Срочно разобрать обращения клиентов в чате поддержки',
    primaryIncludes: ['Support'],
    tagsInclude: 'urgency:high',
    minConfidence: 55,
  },
  {
    name: 'operations process system',
    input: 'Построй систему операционных процессов и координации команды',
    primaryIncludes: ['Operations'],
    tagsInclude: 'outcome:system',
    minConfidence: 55,
  },
  {
    name: 'b2b enterprise sales',
    input: 'B2B корпоративные продажи и сложный долгий цикл сделки',
    primaryIncludes: ['Sales'],
    tagsInclude: 'business:b2b',
    minConfidence: 55,
  },
  {
    name: 'ecommerce growth',
    input: 'Интернет-магазин на маркетплейсе, нужен рост продаж и конверсии',
    primaryIncludes: ['Marketing', 'Sales'],
    tagsInclude: 'business:ecommerce',
    minConfidence: 55,
  },
  {
    name: 'saas onboarding support',
    input: 'SaaS платформа, нужна поддержка клиентов и автоматизация onboarding',
    primaryIncludes: ['Support', 'Automation'],
    tagsInclude: 'business:saas',
    minConfidence: 55,
  },
  {
    name: 'revenue growth strategy',
    input: 'Хочу увеличить выручку и конверсию в продажах',
    primaryIncludes: ['Sales'],
    tagsInclude: 'goal:revenue',
    minConfidence: 55,
  },
  {
    name: 'action plan request',
    input: 'Составь план действий и стратегию на квартал',
    primaryIncludes: ['Operations', 'Marketing'],
    tagsInclude: 'outcome:action-plan',
    minConfidence: 50,
  },
  {
    name: 'lead loss pain',
    input: 'Теряем лиды, заявки забываются, нужен контроль',
    primaryIncludes: ['Sales'],
    tagsInclude: 'pain:lead-loss',
    minConfidence: 55,
  },
  {
    name: 'time pressure automation',
    input: 'Не хватает времени, нужно автоматизировать рутину быстро',
    primaryIncludes: ['Automation'],
    tagsInclude: 'pain:time-pressure',
    minConfidence: 55,
  },
  {
    name: 'low-signal vague request',
    input: 'Помогите',
    needsReview: true,
    maxConfidence: 54,
  },
  {
    name: 'mixed marketing and content',
    input: 'Нужен контент и рекламная кампания для продвижения бренда',
    primaryIncludes: ['Content', 'Marketing'],
    secondaryExpected: true,
    minConfidence: 55,
  },
  {
    name: 'analytics report deliverable',
    input: 'Подготовь отчёт по аналитике и метрикам эффективности',
    primaryIncludes: ['Analytics'],
    tagsInclude: 'deliverable:report',
    minConfidence: 55,
  },
];

function includesAnyPrimary(
  primaryTeam: NavigatorTeamCategory[],
  expected: NavigatorTeamCategory[],
): boolean {
  return expected.some((category) => primaryTeam.includes(category));
}

describe('Navigator engine', () => {
  it('extracts structured signals and tags', () => {
    const analysis = analyzeNavigatorInput('Я стоматолог и устал отвечать в WhatsApp срочно');

    assert.ok(analysis.signals.profession.includes('Стоматология'));
    assert.ok(analysis.signals.painPoints.includes('Перегрузка сообщениями'));
    assert.ok(analysis.signals.urgency.includes('Срочность'));
    assert.ok(analysis.tags.includes('profession:dentistry'));
  });

  it('scores multiple teams deterministically', () => {
    const input = 'Нужен контент и рекламная кампания для лидов';
    const analysis = analyzeNavigatorInput(input);
    const scores = scoreNavigatorTeams(input, analysis.signals, analysis.tags);

    assert.ok(scores.Marketing > 0);
    assert.ok(scores.Content > 0);
    assert.ok(scores.Sales > 0);
  });

  it('returns secondary team when top scores are within 10 points', () => {
    const recommendation = buildNavigatorRecommendation(
      'Нужен контент и рекламная кампания для продвижения бренда',
    );
    const ranked = Object.entries(recommendation.scores).sort((a, b) => b[1] - a[1]);
    const top = ranked[0]?.[1] ?? 0;
    const second = ranked[1]?.[1] ?? 0;

    if (top - second < 10) {
      assert.ok(recommendation.secondaryTeam.length > 0);
    }
  });

  for (const scenario of SCENARIOS) {
    it(`recommends teams for scenario: ${scenario.name}`, () => {
      const recommendation = buildNavigatorRecommendation(scenario.input);

      assert.ok(recommendation.primaryTeam.length > 0);
      assert.ok(recommendation.reasoning.length > 0);
      assert.ok(recommendation.confidence >= 0 && recommendation.confidence <= 100);

      if (scenario.primaryIncludes) {
        assert.ok(
          includesAnyPrimary(recommendation.primaryTeam, scenario.primaryIncludes),
          `expected one of ${scenario.primaryIncludes.join(', ')} in ${recommendation.primaryTeam.join(', ')}`,
        );
      }

      if (scenario.tagsInclude) {
        assert.ok(recommendation.tags.includes(scenario.tagsInclude));
      }

      if (scenario.minConfidence !== undefined) {
        assert.ok(recommendation.confidence >= scenario.minConfidence);
      }

      if (scenario.maxConfidence !== undefined) {
        assert.ok(recommendation.confidence <= scenario.maxConfidence);
      }

      if (scenario.needsReview) {
        assert.equal(recommendation.needsNavigatorReview, true);
      }

      if (scenario.secondaryExpected) {
        assert.ok(recommendation.secondaryTeam.length > 0);
      }
    });
  }
});
