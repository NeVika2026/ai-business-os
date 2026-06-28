<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->
---

# AI Business OS Rules

## Workflow

- Never create commits unless explicitly requested.
- Never push unless explicitly requested.
- Always inspect existing code before creating new files.
- Extend existing architecture instead of duplicating functionality.
- Keep implementations deterministic.
- Preserve backward compatibility whenever possible.
- Avoid changing Runtime, Gateway, Memory, Knowledge or Automation unless the task requires it.

## Validation

After every completed task run:

```bash
npm run lint
npm run build
npm test
```

## Response format

Always finish implementation reports with:

Created:
Modified:
Deleted:
Fixed:
Risk:
lint:
build:
tests:
git status:
git log --oneline -5
