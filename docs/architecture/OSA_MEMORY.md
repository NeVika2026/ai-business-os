# OSA Memory — Architecture

> **Status:** Foundation — Runtime Memory Engine v1 (in-memory)  
> **Audience:** Product, engineering  
> **Scope:** Операционная память OSA — не chat history  
> **Implementation:** `lib/memory/`, `types/memory.ts`  
> **Related:** [OSA_BRAIN.md](./OSA_BRAIN.md) · [AI_RUNTIME.md](./AI_RUNTIME.md) · [MEMORY-GUIDE.md](../guides/MEMORY-GUIDE.md)

---

## 1. Зачем Memory Engine

OSA — операционная система бизнеса, не лента сообщений.

**Chat History** хранит реплики. **Memory Engine** хранит **работу**: задачу, результат, намерение, контекст маршрутизации, проект, время и краткое summary.

После первого результата пользователь не должен начинать с нуля. Memory Engine — фундамент этого обещания на уровне Runtime.

```text
Gateway success
  → captureGatewayMemory()
  → MemoryEntry (task, result, intent, routing, project, summary, time)
  → L0–L4 scopes
  → Navigator / Context / Brain (будущие фазы)
```

---

## 2. Отличие от services/memory

| `services/memory/` | `lib/memory/` (OSA Memory Engine) |
| ------------------ | --------------------------------- |
| Факты, сущности, граф | Операционные записи работы |
| Извлечение из текста | Захват после успешного run |
| Retrieval для промпта | Продолжение бизнес-контекста |
| Agent memories schema | In-memory foundation (v1) |

Оба слоя сосуществуют. OSA Memory Engine — **операционный журнал**, не замена fact engine.

---

## 3. Memory Levels

### L0 — Session Memory

**Scope:** `session`

Пока открыта вкладка. Эфемерный контекст текущей сессии: что пользователь делает прямо сейчас.

- Живёт в памяти процесса
- Привязка к `sessionId`
- Не подменяет долговременную память

### L1 — Daily Memory

**Scope:** `daily`

Что сделано сегодня. Краткий горизонт «рабочего дня» для Navigation и возврата.

- Фильтрация по календарному дню `occurredAt`
- Агрегация в `summarizeMemory({ scope: 'daily' })`

### L2 — Project Memory

**Scope:** `project`

Всё, что относится к одному проекту бизнеса.

- Привязка через `MemoryProject` и `projectId`
- Несколько проектов у одной организации
- Основной уровень для «продолжить работу»

### L3 — Business Memory

**Scope:** `business`

Знания и результаты конкретного пользователя / владельца бизнеса.

- `organizationId` + `userId`
- Устойчивые паттерны работы без привязки к одному проекту

### L4 — Organization Memory

**Scope:** `organization`

Общая память команды. Один бизнес — несколько людей.

- `organizationId`, без обязательного `userId`
- Политики доступа — будущая фаза (tenant isolation уже на уровне query)

---

## 4. MemoryEntry

Каждая запись фиксирует **завершённую работу**, не сообщение чата.

| Поле | Назначение |
| ---- | ---------- |
| `task` | Формулировка задачи пользователя |
| `result` | Артефакт / ответ Gateway |
| `intent` | Связанное намерение (routing intent) |
| `routingCategory` | Категория работы для маршрутизации |
| `summary` | Краткое summary для Navigator и списков |
| `occurredAt` | Время завершения |
| `projectId` | Проект L2 |
| `scope` | L0–L4 |
| `importance` | Приоритет удержания |
| `archived` | Мягкое удаление |

---

## 5. Gateway capture

После **успешного** ответа Gateway Runtime может вызвать:

```text
captureGatewayMemory({
  task,
  result,
  intent,
  routingCategory,
  organizationId,
  userId,
  sessionId,
  projectId | projectName,
  runId,
  correlationId,
})
```

Gateway, Router и UI **не меняются**. Точка подключения — Runtime pipeline / orchestrator (будущая фаза).

---

## 6. API (чистые функции)

| Функция | Назначение |
| ------- | ---------- |
| `createMemory()` | Создать запись |
| `captureGatewayMemory()` | Захват после Gateway success |
| `updateMemory()` | Обновить активную запись |
| `archiveMemory()` | Архивировать (не удалять) |
| `deleteMemory()` | Удалить из in-memory store |
| `findMemory()` | Поиск с фильтрами |
| `findProject()` | Найти проект |
| `listProjects()` | Список проектов |
| `summarizeMemory()` | Агрегированный summary |
| `getRecentMemory()` | Последние записи |

Хранилище: `createMemoryStore()` — изолированный in-memory Map. `getMemoryStore()` — singleton для dev/runtime.

---

## 7. Что Memory Engine не хранит

- Сырой chat log
- Имена моделей и провайдеров
- Credentials
- Данные других организаций
- Несанкционированные побочные эффекты

См. также [OSA_BRAIN.md](./OSA_BRAIN.md) §8–§9.

---

## 8. Эволюция (не v1)

| Фаза | Изменение |
| ---- | --------- |
| v1 | In-memory, `lib/memory/` |
| v2 | Персистенция в Supabase |
| v3 | Инъекция в Context Builder |
| v4 | Navigator Runtime читает `getRecentMemory()` |

---

## 9. Использование документа

- Новое сохранение после run → `captureGatewayMemory`, проверить scope
- Новый экран «истории» → сначала этот документ, не chat table
- Спор chat vs memory → Memory Engine wins для продукта OSA
