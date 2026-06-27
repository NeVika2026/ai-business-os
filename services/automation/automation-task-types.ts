export type AutomationTaskStatus =
  | 'pending'
  | 'ready'
  | 'running'
  | 'completed'
  | 'failed'
  | 'blocked'
  | 'skipped'
  | 'prepared';

export type AutomationTaskMetadataValue = string | number | boolean | null;

/**
 * Canonical automation task model shared by planners and executors.
 */
export interface AutomationTask {
  id: string;
  title: string;
  description: string | null;
  dependencies: string[];
  status: AutomationTaskStatus;
  priority: number;
  order: number;
  metadata: Record<string, AutomationTaskMetadataValue>;
}

export interface AutomationTaskGraphNode {
  id: string;
  dependencies: string[];
  status?: AutomationTaskStatus;
}
