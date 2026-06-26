# AI Business OS

Платформа цифровой AI-команды для бизнеса.

## Стек

- **Next.js 16** — App Router, React Server Components
- **React 19** + **TypeScript**
- **Tailwind CSS 4** + **shadcn/ui**
- **Supabase** — аутентификация и backend-as-a-service
- **TanStack Query** — серверное состояние и кэширование
- **React Hook Form** + **Zod** — формы и валидация
- **ESLint** + **Prettier** — линтинг и форматирование

## Быстрый старт

```bash
# Установка зависимостей
npm install

# Настройка переменных окружения
cp .env.example .env
# Заполните NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY

# Запуск dev-сервера
npm run dev
```

Приложение будет доступно на [http://localhost:3000](http://localhost:3000).

## Структура проекта

```
src/
├── app/              # Next.js App Router
├── components/       # React-компоненты (ui/ — shadcn/ui)
├── lib/              # Утилиты, Supabase, env
└── providers/        # React-провайдеры (TanStack Query)
```

## Скрипты

| Команда         | Описание                  |
| --------------- | ------------------------- |
| `npm run dev`   | Dev-сервер с Turbopack    |
| `npm run build` | Production-сборка         |
| `npm run start` | Запуск production-сервера |
| `npm run lint`  | ESLint                    |
| `npm run format`| Prettier                  |

## Переменные окружения

Скопируйте `.env.example` в `.env` и заполните значения:

- `NEXT_PUBLIC_SUPABASE_URL` — URL проекта Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — публичный anon key Supabase
