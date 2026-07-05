# OSA Roadmap

> **Последнее обновление:** 2026-07-05  
> **Ветка:** `develop`  
> **Статус:** v0.1–v0.5 shipped · v0.6 in progress · v1.0 planned

---

## Как читать этот документ

Roadmap описывает эволюцию OSA от инфраструктурного Runtime до публичного продукта. Каждый этап — законченый слой, который добавляет ценность пользователю, не ломая предыдущие.

**Источники:** git-история (`develop`), архитектурные документы (`docs/architecture/`), продуктовые критерии (`docs/product/MVP_DEFINITION.md`, `docs/releases/OSA_v0.5_PRIVATE_ALPHA.md`).

```text
v0.1 Runtime          → OSA понимает проект и память
v0.2 Executive Brain  → OSA принимает решения до вызова модели
v0.3 Workspace        → OSA даёт рабочую среду CEO
v0.4 AI Orchestra     → OSA запускает AI-команду
v0.5 Event Runtime    → OSA помнит всё, что произошло
v0.6 Investor Demo    → OSA показывает себя за 90 секунд
─────────────────────────────────────────────────────────
v0.7 First Contact    → OSA встречает пользователя
v0.8 Real Results     → OSA выдаёт реальный результат
v0.9 Private Alpha    → OSA работает каждый день без разработчиков
v1.0  Public MVP      → OSA готова к первым реальным пользователям
```

---

## v0.1 — Runtime

**Коммиты:** `93bdecc` Memory Engine · `7108952` Project Runtime · `7e6d7cd` Persistence

### Цель

Создать фундамент, на котором OSA понимает **контекст проекта**, а не только последний промпт. Проект становится рабочей средой с собственной памятью, Navigator и Today.

### Ключевые функции

- **Universal AI Gateway** — единая точка вызова моделей (OpenAI, Anthropic, Gemini и др.)
- **Memory Engine** — project-scoped память, injection в Gateway
- **Project Runtime** — `ProjectRuntime` entity: mission, summary, nextStep, navigatorState
- **Navigator** — следующие шаги на основе состояния проекта
- **Today Briefing** — краткий брифинг дня из runtime
- **Persistence Layer** — сохранение runtime-состояния между сессиями
- **Sync from Workspace** — синхронизация runtime с проектами из Supabase

### Критерий готовности

- [x] `ProjectRuntime` создаётся и обновляется для каждого проекта
- [x] Gateway получает memory context из Memory Engine
- [x] Navigator и Today строятся из runtime, не из chat history
- [x] Тесты: `tests/project-runtime/`, `tests/memory/`
- [x] Build, lint, tests проходят

### Что пользователь может сделать после этапа

OSA помнит, над чем работает пользователь. При возврате в проект система знает миссию, последнюю активность и предлагает следующий шаг — без повторного объяснения контекста.

---

## v0.2 — Executive Brain

**Коммит:** `d045821`

### Цель

Добавить слой принятия решений **до** вызова модели. OSA определяет цель, режим работы, активный проект и память — пользователь не управляет этим вручную.

### Ключевые функции

- **ExecutiveDecision** — goal, workingMode, projectId, memoryMode, navigatorMode
- **applyExecutiveBrain** — точка входа в Gateway pipeline
- **Goal detection** — find_clients, create_content, business_analysis, design, learning
- **Project selection** — автоматический выбор или создание project runtime
- **Memory mode** — решение, какую память подключить к запросу
- **Navigator mode** — что предложить после ответа

### Критерий готовности

- [x] Executive Brain вызывается перед memory injection в Gateway
- [x] `reasoning` не показывается пользователю
- [x] Router и Policy не изменены — Brain дополняет, не заменяет
- [x] Документация: `docs/architecture/OSA_EXECUTIVE_BRAIN.md`
- [x] Тесты executive decision flow

### Что пользователь может сделать после этапа

Пользователь формулирует задачу своими словами — OSA сама определяет цель, выбирает проект и подключает нужный контекст. Нет выбора моделей, нет настройки памяти.

---

## v0.3 — Workspace

**Коммиты:** `ace63e7` Project Workspace · `6890632` Morning Briefing

### Цель

Превратить проект из записи в БД в **Executive Workspace** — спокойную рабочую среду CEO с фокусом дня, AI-командой и Executive Brain на боковой панели.

### Ключевые функции

- **OSA Project Workspace** — `/workspace/[projectId]`, executive-first UI
- **Executive Workspace View** — todayHeadline, focus, team, brief
- **Morning Briefing** — утренний брифинг с primary prompt и действиями
- **Workspace Loader** — сборка page data из runtime, orchestra, memory
- **Conversation** — диалог с OSA внутри workspace
- **Workspace Timeline** — хронология активности проекта
- **Orbit presence** — визуальный якорь бренда в workspace

### Критерий готовности

- [x] Workspace открывается по projectId и показывает Today + Focus + Team
- [x] Morning Briefing появляется при первом входе и dismissable
- [x] Промпт из workspace проходит через Gateway с Executive Brain
- [x] Тесты: `tests/workspace/morning-briefing.test.ts`
- [x] Нет тупиковых экранов — всегда есть следующий шаг

### Что пользователь может сделать после этапа

Открыть проект и сразу увидеть, что важно сегодня. Начать работу одной кнопкой из Morning Briefing или своим промптом. Executive Brain показывает риски и рекомендации на боковой панели.

---

## v0.4 — AI Orchestra

**Коммит:** `8e4b4bd`

### Цель

Запустить **AI-команду** внутри проекта — специалисты работают параллельно, OSA координирует их и останавливается только когда нужно решение CEO.

### Ключевые функции

- **Project Lifecycle** — bootstrapping проекта: тип, план, специалисты, orchestra
- **AI Orchestra Engine** — advance, blocked states, decision resolution
- **Specialist Selection** — подбор ролей по типу проекта
- **Work Plan Builder** — план работ из lifecycle
- **Executive Brief** — бриф для CEO из lifecycle context
- **AiOrchestraPanel** — UI команды: роли, статусы, blocked decision
- **Orchestra Decision** — пользователь подтверждает решение, orchestra продолжает

### Критерий готовности

- [x] При создании/открытии проекта lifecycle инициализирует orchestra
- [x] Orchestra advance работает по шагам с blocked state
- [x] `resolveOrchestraDecision` разблокирует команду
- [x] UI показывает активных специалистов и ожидающие решения
- [x] Тесты lifecycle и orchestra

### Что пользователь может сделать после этапа

OSA собирает AI-команду под проект и запускает работу. Когда нужно решение CEO — система останавливается и спрашивает. После подтверждения команда продолжает без ручной координации.

---

## v0.5 — Event Runtime

**Коммиты:** `c8bc478` Event Runtime · `50684ef` Executive Memory · `7f1f69c` Project Replay

### Цель

Создать единый **журнал событий** проекта — основу для памяти, replay и observability. Всё, что происходит в OSA, становится событием с actor, source и payload.

### Ключевые функции

- **Event Runtime** — `publishRuntimeEvent()`, namespace `events:runtime`
- **Runtime Event Types** — workspace, orchestra, executive, memory, lifecycle
- **Event Storage** — in-memory server-side storage per project
- **Executive Memory** — автоматическая память решений из events + Executive Brain context
- **Project Replay** — кинематографический replay истории проекта из events
- **Instrumentation** — orchestra, brain, memory, briefing публикуют events

### Критерий готовности

- [x] Все ключевые подсистемы публикуют runtime events
- [x] Executive Memory строится из events, не из chat log
- [x] Project Replay показывает сцены без шумовых events
- [x] Тесты: `tests/event-runtime/`, `tests/workspace/executive-memory.test.ts`, `tests/workspace/project-replay.test.ts`
- [x] Memory entry содержит: date, title, reason, consequence, nextRecommendation

### Что пользователь может сделать после этапа

Открыть **Executive Memory** и увидеть принятые решения с последствиями. Запустить **Project Replay** и просмотреть историю проекта как narrative. OSA помнит не только ответы, но и решения.

---

## v0.6 — Investor Demo

**Статус:** реализовано, не закоммичено

### Цель

Дать инвестору, партнёру или новому пользователю **полный путь OSA за ~90 секунд** — без ручного создания проекта и без влияния на реальные данные.

### Ключевые функции

- **Demo Mode Toggle** — переключатель в Settings (`localStorage`)
- **Investor Demo Launcher** — кнопка на Home при включённом Demo Mode
- **Auto Demo Project** — OSA Product / Landing Page / Investment Platform
- **Demo Project Marker** — `osa-investor-demo-v1`, изоляция от реальных проектов
- **Demo Orchestrator** — 8 шагов, ~56s scripted + First Contact
- **Scripted Journey** — First Contact → Briefing → Workspace → Orchestra → Decision → Memory → Replay → Complete
- **DemoCompleteScreen** — финальный чеклист «Сегодня выполнено»
- **Demo Seed** — `refreshDemoProjectRuntime()` через существующий lifecycle

### Критерий готовности

- [x] Demo Mode не создаёт новых API и Runtime
- [x] Demo project создаётся автоматически через `startInvestorDemo()`
- [x] Сценарий проходит все 10 шагов без ручного вмешательства
- [x] Реальные проекты не затрагиваются
- [x] Тесты: `tests/demo/investor-demo.test.ts`
- [ ] Build, lint, tests — pass (verified locally)

### Что пользователь может сделать после этапа

Включить Demo Mode → нажать «Запустить Investor Demo» → за 90 секунд увидеть First Contact, Morning Briefing, Executive Workspace, AI Orchestra, принятое решение, Executive Memory, Project Replay и финальный экран. Понять продукт без onboarding и без создания проекта вручную.

---

## Дорожная карта до v1.0

Этапы v0.7–v1.0 основаны на `docs/product/MVP_DEFINITION.md`, `docs/product/MVP_GAP_ANALYSIS.md` и `docs/releases/OSA_v0.5_PRIVATE_ALPHA.md`.

---

## v0.7 — First Contact

**Приоритет:** P0 · **Зависит от:** v0.6

### Цель

Создать **первое впечатление** — пользователь понимает, что такое OSA, за 30 секунд получает первый результат и не видит технических терминов.

### Ключевые функции

- **First Contact** — cinematic intro, не onboarding wizard
- **Login Entry** — единая точка входа с promise, не module dashboard
- **First Result** — первый осмысленный output после входа
- **Auto Project Creation** — проект создаётся из цели, не вручную
- **Project Lifecycle Reveal** — показ подготовки workspace (invisible engine)
- **Brand Foundation** — Orbit, motion, русский язык, без упоминания моделей

### Критерий готовности

- [ ] First Contact → Login → First Result без тупиков
- [ ] Проект создаётся автоматически при первой цели
- [ ] Нет технических терминов на FTU path
- [ ] Весь FTU path на одном языке (RU)
- [ ] Moderated test: 4/5 пользователей понимают, что делать дальше

### Что пользователь может сделать после этапа

Войти в OSA впервые, увидеть First Contact, выбрать цель и получить первый результат в проекте — без объяснения архитектуры и без ручного создания workspace.

---

## v0.8 — Real Results

**Приоритет:** P0 · **Зависит от:** v0.7

### Цель

Заменить simulated/demo output на **реальные бизнес-результаты** — текст, план, черновик, список, который пользователь использует сегодня.

### Ключевые функции

- **Runtime Bridge** — `RUNTIME_BRIDGE_ENABLED` для production cohort
- **Real Gateway Completion** — один провайдер, один shot per goal
- **Result Experience** — human timeline, summary, celebration, what's next
- **Goal → Result funnel** — handoff создаёт run с project_id
- **Intent Confirmation** — пользователь подтверждает перед execution
- **Continue Flow** — «что дальше» после результата

### Критерий готовности

- [ ] Default execution path возвращает usable business output, не engine jargon
- [ ] TTFV < 5 минут (signup → first usable result)
- [ ] First Result Rate > 80% в moderated test
- [ ] Result привязан к project автоматически
- [ ] Instrumentation: goal_selected, result_completed timestamps

### Что пользователь может сделать после этапа

Выбрать цель («найти клиентов», «создать контент») и получить результат, который можно использовать в работе сегодня — план, черновик, список действий. Сохранить в проект и вернуться завтра.

---

## v0.9 — Private Alpha

**Приоритет:** P0 · **Зависит от:** v0.8  
**Референс:** `docs/releases/OSA_v0.5_PRIVATE_ALPHA.md`

### Цель

Дать доступ **10–20 первым пользователям**, которые могут пользоваться OSA каждый день без помощи разработчиков.

### Ключевые функции

- **Daily Rhythm** — Morning Briefing + Continue на Home
- **7-Day Retention Loop** — Home помнит вчерашнюю работу
- **In-app Notifications** — уведомление о завершении работы
- **Stability Gate** — build, lint, tests, no critical errors
- **Feedback Collection** — что непонятно, где сложности, что понравилось
- **Resilience** — fallback при ошибках concierge/home load

### Критерий готовности

- [ ] 10–20 пользователей активны без support от команды
- [ ] Second Visit > 50% within 7 days
- [ ] Weekly Retention > 30%
- [ ] Нет критических падений приложения
- [ ] Feedback собран и приоритизирован

### Что пользователь может сделать после этапа

Открывать OSA каждое утро, видеть Morning Briefing, продолжать вчерашнюю работу одной кнопкой и получать результаты без re-onboarding. OSA становится ежедневной привычкой.

---

## v1.0 — Public MVP

**Приоритет:** launch · **Зависит от:** v0.9  
**Референс:** `docs/product/MVP_DEFINITION.md`

### Цель

Запустить **первых реальных пользователей** с доказанным product-market fit hypothesis: solo business owner получает usable deliverable за 5 минут и возвращается в течение 7 дней.

### Ключевые функции

- **Landing Page** — 30-second promise + sign in CTA
- **MVP User Journey** — Landing → Login → Home → Goal → Result → Project → Return
- **AI Concierge** — FTU-adaptive Home, не module dashboard
- **Project Workspace** — рабочая поверхность с History и Documents placeholder
- **AI Memory** — контекст бизнеса сохраняется между сессиями
- **Basic Notifications** — in-app minimum
- **Moderated User Test** — 5 participants, 4/5 success criteria

### Критерий готовности

- [ ] MVP Must Have checklist из MVP_DEFINITION — все пункты ✅
- [ ] MVP Must NOT Have — marketplace, billing, CRM, dev tools скрыты из primary nav
- [ ] TTFV < 5 min · First Result Rate > 80% · Second Visit > 50% · Weekly Retention > 30%
- [ ] 5-user moderated test passed
- [ ] Один consistent locale на FTU path
- [ ] Production deploy stable

### Что пользователь может сделать после этапа

Сказать OSA, чего хочет достичь — платформа организует работу, готовит workspace и выдаёт результат, который можно использовать сегодня. Вернуться завтра — Home помнит, где остановились. OSA — personal AI director for business, не набор инструментов.

---

## Принципы roadmap

1. **Существующая архитектура** — новые этапы расширяют Runtime, Brain, Workspace, Orchestra, Events; не дублируют
2. **Invisible engine** — пользователь не видит модели, runtime, orchestrator
3. **Project as workspace** — не chat history, не PM tool
4. **Decision before model** — Executive Brain решает до Gateway
5. **Events as source of truth** — Memory и Replay строятся из Event Runtime
6. **Demo ≠ Production** — Investor Demo изолирован marker + localStorage session
7. **Value before vision** — v1.0 = one loop (goal → result → continue), не full Business OS

---

## Связанные документы

| Документ | Назначение |
| -------- | ---------- |
| [MVP Definition](./product/MVP_DEFINITION.md) | Критерии v1.0 |
| [MVP Gap Analysis](./product/MVP_GAP_ANALYSIS.md) | Что между текущим build и launch |
| [Private Alpha Release](./releases/OSA_v0.5_PRIVATE_ALPHA.md) | Чеклист private alpha |
| [Vision 2035](./VISION_2035.md) | Долгосрочное видение |
| [OSA Project Runtime](./architecture/OSA_PROJECT_RUNTIME.md) | v0.1 architecture |
| [OSA Executive Brain](./architecture/OSA_EXECUTIVE_BRAIN.md) | v0.2 architecture |
| [Engineering Roadmap](./product/ROADMAP.md) | EPIC C–E sprint backlog |

---

## История версий

| Версия | Дата | Коммит | Статус |
| ------ | ---- | ------ | ------ |
| v0.1 Runtime | 2026-06-30 | `7108952` | ✅ Shipped |
| v0.2 Executive Brain | 2026-06-30 | `d045821` | ✅ Shipped |
| v0.3 Workspace | 2026-07-04 | `6890632` | ✅ Shipped |
| v0.4 AI Orchestra | 2026-07-05 | `8e4b4bd` | ✅ Shipped |
| v0.5 Event Runtime | 2026-07-05 | `c8bc478` | ✅ Shipped |
| v0.6 Investor Demo | 2026-07-05 | — | 🔄 In progress |
| v0.7 First Contact | — | — | 📋 Planned |
| v0.8 Real Results | — | — | 📋 Planned |
| v0.9 Private Alpha | — | — | 📋 Planned |
| v1.0 Public MVP | — | — | 📋 Planned |
