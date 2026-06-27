# Runtime Guide

## Execution Flow

```
RuntimeApi → RuntimeBridge → RuntimeExecution
  → Context → Prompt → Gateway → Tools → Response
```

## Bridge Instances

Each `createRuntimeBridge({ instanceId })` gets:

- Scoped tool registry
- Gateway adapter
- Memory/knowledge context
- Runtime observer

## Checkpointing

`services/runtime/execution/checkpoint-store.ts` persists:

- Worker state (roadmap, tasks, planner snapshot)
- Execution history
- Stage-level checkpoints

## Feature Flags

- `RUNTIME_BRIDGE_ENABLED` — orchestrator actions use live bridge
- `GATEWAY_USE_MOCK` — mock vs HTTP gateway adapters

## Reset

`resetRuntime()` cascades through bridge, adapters, idempotency store, and audit recorder.
