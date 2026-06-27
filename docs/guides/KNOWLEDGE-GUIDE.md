# Knowledge Guide

## Components

- **KnowledgeIndex** — chunk indexing
- **KnowledgeSearchEngine** — query search
- **KnowledgePipeline** — ingest → index → search
- **KnowledgeVaultLoader** — markdown vault import

## Runtime Integration

Knowledge injection flows through `RuntimeKnowledgeContext` → context builder → prompt compiler.

## Tool Access

`knowledge.search` tool uses KnowledgeSearchEngine scoped by organization.

## Import

Use `KnowledgeSourceImporter` and vault loader for markdown ingestion.
