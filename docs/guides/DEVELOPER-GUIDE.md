# Developer Guide

## Prerequisites

- Node.js 20+
- npm 10+

## Setup

```bash
npm ci
cp .env.example .env
```

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Start Next.js dev server |
| `npm run lint` | ESLint |
| `npm run build` | Production build |
| `npm test` | Full test suite (mock gateway) |
| `npm run test:coverage` | Tests with 80% coverage gate |
| `npm run benchmark` | Runtime latency benchmarks |
| `npm run security:audit` | Dependency + secret scan |

## Architecture Entry Points

- **RuntimeBridge** — `services/runtime/runtime-bridge.ts`
- **Gateway** — `services/runtime/gateway/ai-gateway.ts`
- **Tool executor** — `services/runtime/tools/executor/pipeline.ts`
- **Autonomous worker** — `services/automation/autonomous-worker.ts`

## Adding a Tool

1. Define schema in `services/runtime/tools/categories/`
2. Implement handler in `services/runtime/tools/handlers/`
3. Register in `services/runtime/tools/production-handlers.ts`

## Testing

Tests use `GATEWAY_USE_MOCK=true` so no provider keys are required in CI.
