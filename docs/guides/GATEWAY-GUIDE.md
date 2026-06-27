# Gateway Guide

## Providers

| Code | Adapter | Streaming |
|---|---|---|
| openai | HttpOpenAiCompatibleAdapter | SSE |
| anthropic | HttpAnthropicAdapter | SSE |
| openrouter | HttpOpenAiCompatibleAdapter | SSE |
| groq | HttpOpenAiCompatibleAdapter | SSE |
| ollama | HttpOllamaAdapter | NDJSON |
| gemini | HttpGeminiAdapter | SSE |

## API

```typescript
import { aiGateway } from '@/services/runtime/gateway/ai-gateway';

await aiGateway.complete(request);
for await (const chunk of aiGateway.stream(request)) { ... }
aiGateway.cancelStream(runId);
```

## Credentials

Resolved via `credential-resolver.ts`:

1. Tenant lookup hook (if configured)
2. Environment variables (`OPENAI_API_KEY`, etc.)

## Resilience

- Retry: `gateway-retry.ts` (3 attempts, exponential backoff)
- Timeout: `http-client.ts` / `fetchStreamingResponse`
- Rate limit: `gateway-rate-limiter.ts` (120 req/min per org+provider)

## Mock Mode

Set `GATEWAY_USE_MOCK=true` for CI and local testing without API keys.
