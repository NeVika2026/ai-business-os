# Memory Guide

## Components

- **MemoryEngine** — fact storage
- **MemoryExtractor** — text → facts
- **MemoryRetriever** — ranked search
- **MemoryService** — unified API

## Runtime Integration

Memory injection flows through `RuntimeMemoryContext` → `RuntimeContextAdapter` → prompt compiler.

## Tool Access

`memory.search` tool queries the in-memory MemoryService for the organization scope.

## Configuration

Memory injection is enabled by default on RuntimeBridge (`memoryInjectionEnabled: true`).
