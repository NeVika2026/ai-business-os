export type EventRuntimeStatus = 'pending' | 'completed' | 'failed';

export type EventRuntimeSource =
  | 'project_lifecycle'
  | 'executive_brain'
  | 'memory'
  | 'navigator'
  | 'ai_orchestra'
  | 'workspace'
  | 'morning_briefing';

export type RuntimeEventRecord = {
  id: string;
  timestamp: string;
  projectId: string | null;
  type: string;
  actor: string;
  payload: Record<string, unknown>;
  source: EventRuntimeSource;
  status: EventRuntimeStatus;
};

export type PublishRuntimeEventInput = {
  id?: string;
  timestamp?: string;
  projectId?: string | null;
  type: string;
  actor: string;
  payload?: Record<string, unknown>;
  source: EventRuntimeSource;
  status?: EventRuntimeStatus;
};

export const RUNTIME_EVENT_TYPES = {
  PROJECT_LIFECYCLE_STARTED: 'project.lifecycle.started',
  PROJECT_LIFECYCLE_COMPLETED: 'project.lifecycle.completed',
  EXECUTIVE_DECISION_RECORDED: 'executive.decision.recorded',
  EXECUTIVE_POST_CAPTURE_RECORDED: 'executive.post_capture.recorded',
  MEMORY_ENTRY_CREATED: 'memory.entry.created',
  MEMORY_ENTRY_UPDATED: 'memory.entry.updated',
  MEMORY_ENTRY_ARCHIVED: 'memory.entry.archived',
  MEMORY_ENTRY_DELETED: 'memory.entry.deleted',
  NAVIGATOR_STATE_UPDATED: 'navigator.state.updated',
  ORCHESTRA_INITIALIZED: 'orchestra.initialized',
  ORCHESTRA_AGENT_ADVANCED: 'orchestra.agent.advanced',
  ORCHESTRA_BLOCKED_RESOLVED: 'orchestra.blocked.resolved',
  WORKSPACE_LOADED: 'workspace.loaded',
  WORKSPACE_PROMPT_SUBMITTED: 'workspace.prompt.submitted',
  WORKSPACE_PROMPT_COMPLETED: 'workspace.prompt.completed',
  WORKSPACE_PROMPT_FAILED: 'workspace.prompt.failed',
  WORKSPACE_ORCHESTRA_RESOLVED: 'workspace.orchestra.resolved',
  MORNING_BRIEFING_PREPARED: 'morning_briefing.prepared',
} as const;
