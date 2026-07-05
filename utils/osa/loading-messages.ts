export const OSA_LOADING_MESSAGES = {
  executiveBrain: 'Executive Brain анализирует проект…',
  orchestra: 'AI Orchestra строит план…',
  deliverables: 'Создаются Deliverables…',
  gateway: 'OSA готовит результат…',
  improve: 'Executive Brain улучшает deliverable…',
  decision: 'Executive Brain принимает решение…',
  workspace: 'OSA обновляет Workspace…',
} as const;

export type OsaLoadingMessageKey = keyof typeof OSA_LOADING_MESSAGES;
