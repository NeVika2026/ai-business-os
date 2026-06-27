# Deployment Guide

## Build

```bash
npm ci
npm run lint
npm run build
npm test
npm run test:coverage
```

## Production Configuration

1. Set `GATEWAY_USE_MOCK=false`
2. Configure provider API keys in environment secrets
3. Set `RUNTIME_BRIDGE_ENABLED=true` when ready for live orchestrator execution
4. Configure Supabase variables for auth

## Deploy Targets

The app is a standard Next.js 16 application. Deploy to any Node.js host supporting `next start`.

## Post-Deploy Verification

```bash
curl /api/health
curl /api/runtime/diagnostics
```

## Rollback

Redeploy previous build artifact. Runtime state is in-memory by default — no migration required for rollback.
