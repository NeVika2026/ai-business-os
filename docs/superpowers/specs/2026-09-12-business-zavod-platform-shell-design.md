# Business Zavod Platform Shell — Design

## Goal

Transform the existing OSA product into the first real platform iteration of **Бизнес Завод** without replacing OSA's runtime, memory, executive brain, orchestra, project lifecycle, or existing result flows.

The platform must feel like an operating environment, not a single video generator or a single chat screen.

## Product position

- **Бизнес Завод** is the user-facing product and workspace.
- **OSA** remains the AI-director/persona and orchestration brain inside the product.
- Existing OSA runtime architecture is reused; no parallel runtime is introduced.
- Provider brands stay out of the primary interface. They belong in Integrations later.

## First-iteration scope

This iteration delivers:
1. Persistent platform navigation.
2. A universal AI command center on Home.
3. Voice input in the command field.
4. A task catalog that makes the platform breadth visible.
5. Module landing pages that route tasks back into the existing OSA execution flow.
6. User-facing rebrand from “AI Business OS” to “Бизнес Завод” in the shell.

This iteration does not yet implement publishing APIs, billing, provider marketplace, or a new CRM backend.

## Information architecture

Primary navigation:
- Главная
- Создать
- Продать
- Продвинуть
- Опубликовать
- Найти
- Проанализировать
- Автоматизировать
- Проекты
- Файлы
- Интеграции

Home stays action-first. The dominant element is still the OSA prompt, but the surrounding shell makes it clear that this is a multi-capability platform.

## Universal command center

The Home prompt accepts ordinary Russian:
- “Сделай ролик про страхование квартиры”
- “Найди клиентов на новостройки”
- “Собери презентацию”
- “Проанализируй конкурентов”

The existing OSA execution path remains the destination. The platform shell only improves entry, discovery, and routing.

Voice input uses browser speech recognition when available. Unsupported browsers keep the normal text workflow with no blocking error.

## Task catalog

The catalog is configuration-driven. Each task contains:
- id
- module
- title
- short description
- starter prompt
- optional badge

Selecting a task opens Home with a starter prompt prefilled. The user can edit it before execution.

## Architecture

New platform configuration lives separately from OSA runtime code. UI components consume that configuration, so modules can be expanded later without rewriting the shell.

Planned units:
- `utils/platform/business-zavod-config.ts` — nav + task catalog + starter prompts.
- `components/platform/PlatformTaskCatalog.tsx` — task cards.
- `components/platform/VoiceInputButton.tsx` — browser voice capture.
- `app/(dashboard)/modules/[module]/page.tsx` — generic module landing page.
- Existing `OsaHomeActionScreen` — extended, not replaced.
- Existing `Sidebar` / `AppShell` — rebranded and expanded.

Core Runtime, Gateway, Memory, Knowledge, Automation, Orchestra and Supabase data model are not changed in this phase.

## Data flow

1. User opens Home or a module page.
2. User types, dictates, or chooses a task.
3. Module/task selection produces a starter prompt.
4. Home receives the prompt and shows it in the existing OSA composer.
5. User confirms execution.
6. Existing `startHomeRealWork` and OSA Orchestra handle the work.
7. Existing result/workspace flows continue unchanged.

## UX rules

- Russian-first copy.
- No provider/model jargon in the primary interface.
- No dead-end module cards.
- Voice is optional and never blocks text entry.
- Home remains the fastest path to a result.
- Existing OSA visual identity can remain as the AI-director character.
- “Бизнес Завод” is the product brand in the shell.

## Verification

Required before calling this phase complete:
- New config tests pass.
- Voice helper tests pass.
- Existing full test suite passes.
- ESLint passes.
- Next.js production build passes.
- Manual browser check confirms sidebar, Home, module page, task handoff and microphone fallback render without console errors.
