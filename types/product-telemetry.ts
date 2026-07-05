export const PRODUCT_TELEMETRY_EVENTS = {
  PROJECT_CREATED: 'product.project.created',
  REPLAY_OPENED: 'product.replay.opened',
  EXECUTIVE_MEMORY_OPENED: 'product.executive_memory.opened',
  DELIVERABLE_IMPROVE_CLICKED: 'product.deliverable.improve_clicked',
  INVESTOR_DEMO_COMPLETED: 'product.investor_demo.completed',
} as const;

export type ProductTelemetryEvent = keyof typeof PRODUCT_TELEMETRY_EVENTS;
