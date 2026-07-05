# OSA Hero Screen — Concept Exploration

> **Phase:** OSA Hero Screen Exploration  
> **Status:** Design concepts — ready for Figma translation  
> **Figma page (planned):** `OSA Concept Exploration`  
> **Frame size:** Desktop 1440 × 1024  
> **Not:** Code, components, implementation

---

## Figma status

**Figma MCP не подключена** в текущей среде — фреймы в Figma не созданы автоматически.

Ниже — полные спецификации четырёх концепций для ручного переноса или для создания через Figma MCP при подключении.

### Планируемая структура в Figma

| Страница | Фреймы |
| -------- | ------ |
| **OSA Concept Exploration** | `Concept A — Studio` (1440×1024) |
| | `Concept B — Canvas` (1440×1024) |
| | `Concept C — Cockpit` (1440×1024) |
| | `Concept D — Executive` (1440×1024) |

---

## Общие правила (все концепты)

### Палитра

| Token | Value | Use |
| ----- | ----- | --- |
| White | `#FFFFFF` | Основной фон |
| Graphite | `#10131A` | Заголовки, основной текст |
| Graphite soft | `#5B6472` | Вторичный текст |
| Surface | `#F7F8FB` | Тонкие панели, поля |
| Border | `#DFE4EC` | Разделители |
| Orbit blue | `#3D4FE0` | Orbit, primary CTA, фокус |
| Orbit soft | `#EEF0FF` | Мягкий акцент |

### Запрещено

- Яркие цвета, стекломорфизм, кислотные градиенты
- Дешёвые AI-иконки, эмодзи, «нейросетевые» иллюстрации
- Выбор моделей, технический жаргон на экране

### Обязательные элементы (каждый концепт)

| Element | Role |
| ------- | ---- |
| **Orbit** | Символ системы, не декор |
| **Today** | Главный контекст дня |
| **Primary CTA** | Одно главное действие |
| **Workspace** | Текущая рабочая область |
| **Navigator** | Следующий шаг |
| **Memory** | Контекст / история (кратко) |

### Сетка

- Колонки: 12, margin 80px, gutter 24px
- Baseline: 8px
- Типографика: системный sans (SF Pro / Inter), без декоративных шрифтов

---

## Concept A — Studio

**Ассоциации:** Apple · Calm · Premium · Workspace

**Ощущение:** Тихая мастерская. Человек входит — и сразу понимает, зачем пришёл. Ничего лишнего.

### Wireframe

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  OSA                                                    Сегодня · 12 марта     │
│                                                                              │
│                                                                              │
│                                                                              │
│                              ◠  Orbit                                        │
│                                                                              │
│                                                                              │
│                    Что мы создаём сегодня?                                   │
│                                                                              │
│                    ┌─────────────────────────────────────┐                   │
│                    │  Продолжить: Запуск рекламы…        │  ← Primary CTA   │
│                    └─────────────────────────────────────┘                   │
│                                                                              │
│                                                                              │
│  ─────────────────────────────────────────────────────────────────────────   │
│                                                                              │
│  TODAY                          NAVIGATOR              MEMORY                │
│  Запуск рекламы                 Следующий шаг:         Вчера: черновик       │
│  Черновик объявления            Уточнить аудиторию     поста сохранён        │
│  готов к правке                                                                │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Layout

| Zone | Position | Content |
| ---- | -------- | ------- |
| Header | Top, minimal | Wordmark «OSA» слева; дата справа, 13px graphite soft |
| Hero | Center, 60% viewport height | Orbit 64px, вопрос 32px/400, CTA одна кнопка |
| Footer strip | Bottom 28% | Три колонки: Today · Navigator · Memory — без карточек, только текст |

### Typography

- Hero question: 32px, weight 400, letter-spacing −0.02em
- Today headline: 15px medium graphite
- Body: 14px graphite soft, line-height 1.5

### Orbit

Центр экрана, 64×64, Orbit blue, без анимации на макете. Единственный цветной элемент в hero.

### Primary CTA

«Продолжить: [название проекта]» — pill button, Orbit blue fill, white label, 48px height.

### Differentiator

Максимум воздуха. Ни сайдбара, ни карточек. Три нижние зоны — как подписи к одной сцене, не отдельные виджеты.

---

## Concept B — Canvas

**Ассоциации:** Moleskine · Notion · Белый лист · Идеи

**Ощущение:** Чистый холст. Интерфейс почти исчезает. Остаётся только работа.

### Wireframe

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  ◠                                                                            │
│                                                                              │
│  Today                                                                       │
│  ─────────────────────────────────────────────────────────────────────────   │
│                                                                              │
│  Запуск рекламы                                                              │
│                                                                              │
│  Черновик объявления готов.                                                  │
│  Следующий шаг — уточнить аудиторию.                                         │
│                                                                              │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                        │  │
│  │  Workspace                                                             │  │
│  │  [ область ввода / продолжение работы ]                                │  │
│  │                                                                        │  │
│  │                                                                        │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  Navigator · Уточнить аудиторию          Memory · 3 записи за неделю         │
│                                                                              │
│                              [ Продолжить работу ]                           │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Layout

| Zone | Position | Content |
| ---- | -------- | ------- |
| Orbit | Top-left corner, 24px | Минимальный mark, 24×24 |
| Today | Upper third | Заголовок + 2–3 строки контекста, без рамок |
| Workspace | Center 50% | Белое поле с тонкой border `#DFE4EC`, как лист бумаги |
| Footer | Bottom | Navigator и Memory в одну строку, 13px; CTA по центру |

### Typography

- Today title: 24px, weight 500
- Workspace placeholder: 16px, graphite soft
- Footer meta: 13px

### Orbit

24px, угол. Не доминирует — присутствует как знак системы.

### Primary CTA

«Продолжить работу» — text button с underline on hover, или ghost button с border. Не конкурирует с Workspace.

### Differentiator

Интерфейс растворяется. Workspace — главный визуальный объект. Ощущение блокнота, не приложения.

---

## Concept C — Cockpit

**Ассоциации:** Linear · Raycast · Vercel · Профессиональный инструмент

**Ощущение:** Штаб. Всё на месте. Строгая геометрия. Для человека, который работает каждый день.

### Wireframe

```
┌──────────┬───────────────────────────────────────────────┬───────────────────┐
│          │  Today · Запуск рекламы                       │  NAVIGATOR        │
│  ◠ OSA   │  ───────────────────────────────────────────  │  ─────────────    │
│          │                                               │  Следующий шаг    │
│  Today   │  WORKSPACE                                    │  Уточнить         │
│  Projects│  ┌─────────────────────────────────────────┐  │  аудиторию        │
│  Memory  │  │ Черновик объявления                     │  │                   │
│          │  │                                         │  │  ─────────────    │
│  ──────  │  │ [продолжение работы]                    │  │  MEMORY           │
│          │  │                                         │  │  Вчера: черновик  │
│          │  └─────────────────────────────────────────┘  │  2 мар: аудитория │
│          │                                               │                   │
│          │         [ Продолжить ]                        │                   │
│          │                                               │                   │
└──────────┴───────────────────────────────────────────────┴───────────────────┘
  240px              ~880px                                    320px
```

### Layout

| Zone | Width | Content |
| ---- | ----- | ------- |
| Left nav | 240px | Orbit + OSA, Today, Projects, Memory — vertical list, 14px |
| Center | flex | Today header, Workspace card, Primary CTA |
| Right panel | 320px | Navigator top, Memory below — surface `#F7F8FB` |

### Typography

- Nav items: 14px, 36px row height
- Today header: 18px medium
- Workspace: 15px body

### Orbit

В левом меню, 32px, рядом с wordmark. Статичный.

### Primary CTA

«Продолжить» — centered under workspace, accent button, 40px.

### Grid

Строгие вертикали. Border-right `#DFE4EC` между колонками. Без скруглений > 8px.

### Differentiator

Трёхколоночная архитектура. Все шесть элементов видны одновременно. Профессиональный инструмент, не landing.

---

## Concept D — Executive

**Ассоциации:** Apple Vision Pro · Minimal OS · Executive Desk

**Ощущение:** Дорогой продукт. Крупная типографика. Today — весь экран.

### Wireframe

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│  ◠                                                                           │
│                                                                              │
│                                                                              │
│  Today.                                                                      │
│                                                                              │
│  Запуск                                                                      │
│  рекламы.                                                                    │
│                                                                              │
│                                                                              │
│  Черновик объявления готов.                                                  │
│  Следующий шаг — уточнить аудиторию.                                         │
│                                                                              │
│                                                                              │
│                    ┌──────────────────────────┐                              │
│                    │   Продолжить работу        │                              │
│                    └──────────────────────────┘                              │
│                                                                              │
│                                                                              │
│  Workspace · Navigator · Memory                                                │
│  ─────────────────────────────────────────────────────────────────────────   │
│  Проект активен · Уточнить аудиторию · 3 записи в памяти                     │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Layout

| Zone | Position | Content |
| ---- | -------- | ------- |
| Orbit | Top-left, 40px margin | 32×32 |
| Hero type | Left-aligned, 40% width | «Today.» + project name — display size |
| Context | Below hero | 2 строки, 18px graphite soft |
| CTA | Below context, left-aligned | Single accent button |
| Meta strip | Bottom 80px | Workspace · Navigator · Memory — одна строка, 13px, через · |

### Typography

- «Today.»: 72px, weight 300, letter-spacing −0.03em
- Project name: 72px, weight 500
- Context: 18px, weight 400
- Meta strip: 13px uppercase tracking 0.06em labels optional

### Orbit

32px, верхний левый угол. Единственный цветной элемент до CTA.

### Primary CTA

«Продолжить работу» — 52px height, 18px label, generous horizontal padding.

### Differentiator

Today занимает 70% визуального веса. Workspace, Navigator, Memory — сжаты в одну строку внизу. Ощущение executive briefing, не dashboard.

---

## Сравнение концептов

| | A Studio | B Canvas | C Cockpit | D Executive |
| --- | --- | --- | --- | --- |
| **Воздух** | ████████ | ██████░░ | ████░░░░ | ███████░ |
| **Плотность UI** | Минимум | Почти нет | Максимум | Минимум |
| **Today prominence** | Средняя | Высокая | Средняя | Доминирует |
| **Orbit position** | Центр | Угол | Sidebar | Угол |
| **Target user** | Первый вход | Творческая работа | Power user | Executive |
| **Layout model** | Centered hero | Document | 3-column app | Typographic hero |

---

## Следующий шаг (Figma)

1. Подключить Figma MCP или создать файл вручную
2. Создать страницу **OSA Concept Exploration**
3. Разместить 4 фрейма 1440×1024 с именами выше
4. Применить tokens из [COLOR_SYSTEM.md](../brand/COLOR_SYSTEM.md)
5. Согласовать с [OSA_DESIGN_BIBLE.md](./OSA_DESIGN_BIBLE.md)

---

*OSA — место, где работа продолжается.*
