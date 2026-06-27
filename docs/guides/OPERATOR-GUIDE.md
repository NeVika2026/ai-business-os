# Operator Guide

## Health Checks

- App: `GET /api/health`
- Runtime diagnostics: `GET /api/runtime/diagnostics`

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GATEWAY_USE_MOCK` | No | Set `false` for production providers |
| `OPENAI_API_KEY` | Prod | OpenAI gateway |
| `ANTHROPIC_API_KEY` | Prod | Anthropic gateway |
| `OPENROUTER_API_KEY` | Prod | OpenRouter gateway |
| `OLLAMA_BASE_URL` | Optional | Local Ollama endpoint |
| `RUNTIME_BRIDGE_ENABLED` | No | Enable orchestrator bridge execution |

## Monitoring

Runtime observer metrics are available via bridge serialization and `/api/runtime/diagnostics`.

Key metrics: gateway calls, tool calls, memory reads/writes, pipeline runs, cost totals.

## Recovery

Autonomous worker checkpoints persist on start, task completion, pause, and interrupt.

Resume with `worker.resumeFromCheckpoint(runId)`.

## Incident Response

1. Check `/api/runtime/diagnostics` for provider health
2. Verify credentials in environment
3. Review execution history via checkpoint store
4. Reset runtime bridge if state is corrupted: `resetRuntime()`
