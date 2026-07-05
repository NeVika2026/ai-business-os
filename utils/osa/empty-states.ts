export type OsaEmptyStateContent = {
  title: string;
  description: string;
  hint: string;
};

export const OSA_EMPTY_STATES = {
  workspace: {
    title: 'Executive Workspace',
    description: 'Здесь появится фокус дня, AI-команда и следующий шаг проекта.',
    hint: 'Откройте Morning Briefing или отправьте первую задачу OSA.',
  },
  replay: {
    title: 'Project Replay',
    description: 'Здесь появится история проекта — решения, Orchestra и deliverables.',
    hint: 'Начните работу в Workspace: события появятся автоматически.',
  },
  executiveMemory: {
    title: 'Executive Memory',
    description: 'Здесь появятся решения CEO с причиной, последствием и рекомендацией.',
    hint: 'Подтвердите решение Orchestra или завершите deliverable.',
  },
  deliverables: {
    title: 'Deliverables',
    description: 'Landing, планы, скрипты — каждый агент Orchestra создаст свой результат.',
    hint: 'Создайте проект — AI Orchestra запустится автоматически.',
  },
  results: {
    title: 'Results',
    description: 'Здесь будут готовые deliverables с Executive Review и Version History.',
    hint: 'Дождитесь статуса Ready или нажмите Improve для улучшения.',
  },
  orchestra: {
    title: 'AI Orchestra',
    description: 'Здесь появится команда специалистов и прогресс выполнения.',
    hint: 'Создайте проект — Orchestra соберётся из Executive Brain.',
  },
  homeActivity: {
    title: 'Последняя активность',
    description: 'Здесь появятся проекты, Orchestra и Executive Brain.',
    hint: 'Создайте проект или запустите Investor Demo.',
  },
} as const satisfies Record<string, OsaEmptyStateContent>;
