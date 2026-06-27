# Automation Guide

## Components

- **AutomationPlanner** — dependency-ordered task planning
- **AutonomousWorker** — single-task roadmap execution
- **RoadmapTaskExecutor** — file-level task handler
- **AITaskExecutorAdapter** — Cursor/local-agent backends

## Worker Lifecycle

```
start(roadmap) → nextTask() → [lint/build/test] → completed | failed | paused
```

## Checkpoint Recovery

```typescript
worker.interrupt('reason');          // saves checkpoint
worker.resumeFromCheckpoint(runId);  // restores state
worker.nextTask();                   // continue
```

## Cursor Integration

Set `backend: 'cursor'` on AITaskExecutorAdapter for prepared-task flow (external execution).

## Command Runner

Worker runs `npm run lint`, `npm run build`, `npm test` after task execution unless skipped per sprint config.
