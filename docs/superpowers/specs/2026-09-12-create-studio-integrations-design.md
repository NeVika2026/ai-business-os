# Business Zavod — Create Studio and Integrations Design

## Goal

Turn the platform shell into a usable operating environment with two concrete product surfaces:

1. **Студия создания** — a guided entry point for video, images, stories, presentations, documents and voice.
2. **Интеграции** — a truthful provider-status screen driven by server-side environment configuration.

OSA remains the director and execution brain. External AI/media providers are adapters behind the platform, not product navigation.

## Product behavior

### Create Studio

Route: `/modules/create/studio`.

The user chooses what to create, describes the goal, optionally adds audience/context and format. The Studio builds an editable structured brief and hands it to Home/OSA through `/home?prompt=...`.

Creation types in this iteration:
- Видео
- Картинка
- Сторис
- Презентация
- Документ
- Озвучка

Video is treated as a future multi-stage production:
`brief → concept/script → scenes → assets → voice/music/captions → composition → render`.

The UI must not pretend a provider is connected when it is not.

### Integrations

Route: `/settings`.

The page shows provider capability and status only; it never exposes secret values.

Statuses:
- `connected` — required environment variable is present.
- `missing` — variable is absent.
- `built_in` — capability is local/bundled and needs no secret.

Initial catalog:
- Supabase
- OpenAI
- Anthropic
- Google AI
- Groq
- OpenRouter
- Fugu
- Ollama
- Runway
- ElevenLabs
- Remotion

Primary UI may show provider names only on Integrations; Home/modules keep provider-neutral copy.

## Security

- Never render env values.
- Never send server-only secrets to client components.
- Integration status is computed server-side from boolean presence only.
- Existing source OSA env remains untouched.
- No API calls to paid providers in this iteration.

## Architecture

New files:
- `utils/platform/create-studio.ts` — creation modes and brief compiler.
- `components/platform/CreateStudio.tsx` — guided client UI.
- `app/(dashboard)/modules/create/studio/page.tsx`.
- `utils/platform/integration-catalog.ts` — provider metadata and status resolver.
- `components/platform/IntegrationsDashboard.tsx`.
- Modify `app/(dashboard)/settings/page.tsx` to render the dashboard.
- Extend platform task config so creation tasks route to Studio.

## Verification

- TDD for brief compilation and integration status.
- Full `npm test`.
- `npm run lint` must have 0 errors.
- `npm run build` must succeed.
- Local server must return 200 for login and authenticated routes must redirect cleanly when unauthenticated.
