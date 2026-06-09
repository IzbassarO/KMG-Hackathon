# KMG Onboarding Portal

Корпоративный портал онбординга для АО НК «КазМунайГаз». Прототип хакатона.

Стек: **Next.js 15 (App Router) · TypeScript · TailwindCSS · shadcn/ui · @xyflow/react · Zustand-style React Context**. Состояние полностью персистится в `localStorage` — backend не требуется. RAG-подсистема собрана как заглушка с TF-IDF поиском и точкой замены на боевые эмбеддинги.

## Запуск

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # production-сборка
npm run typecheck    # проверка типов
```

Демо-аккаунты появятся на главной (роли HR/сотрудник, всё в браузере).

## Архитектура (высокий уровень)

```
┌─────────────────────────────────────────────────────────────────┐
│                          UI (Next.js App)                       │
│   /  →  лендинг + выбор роли                                    │
│   /hr/*       — HR-консоль (дашборд, тикеты, сотрудники, KB, AI)│
│   /employee/* — рабочее место сотрудника (мой день, путь, ...)  │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                  StoreProvider (lib/store.tsx)                  │
│   useReducer + контекст; помощники createTicket / advanceTask / │
│   askAssistant / logActivity.                                   │
└─────────┬────────────────────────────────────────┬──────────────┘
          │                                        │
          ▼                                        ▼
┌─────────────────────┐                ┌────────────────────────┐
│  localStorage I/O   │                │  RAG (lib/rag.ts)       │
│  lib/storage.ts     │                │  TF-IDF + cosine, ready  │
│  key:                │                │  to swap for embeddings │
│  kmg.onboarding.    │                │  Claude / pgvector.     │
│  portal/v1          │                └────────────────────────┘
└─────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Seed (lib/seed.ts)                        │
│  5 пользователей, 6 flowchart-тикетов, 6 KB-статей,             │
│  активность, демо-чат с ассистентом.                            │
└─────────────────────────────────────────────────────────────────┘
```

### Слой данных

`lib/types.ts` описывает доменные сущности:

- **User** (`hr | employee`)
- **Ticket** + **Flow** (nodes/edges) — единица процесса онбординга
- **OnboardingTask** — задача, привязанная к узлу flow
- **KnowledgeArticle** — источник для RAG
- **ChatSession / ChatMessage** — диалог с AI
- **ActivityEvent** — журнал событий

### Flowchart-тикеты

`components/flowchart/*` — реализация на `@xyflow/react@12`. Узлы пяти типов: `start | task | approval | milestone | decision | end`, каждый стилизован под корпоративную палитру KMG и показывает статус (pending/active/done/blocked), ответственного и оценку. На странице тикета доступны вкладки **Flowchart / Задачи / Комментарии / Аудит**.

`components/shared/ticket-card.tsx` — превью тикета с бейджами, прогрессом и SLA, который ведёт на полный flow.

### RAG-стек (заглушка)

`lib/rag.ts` реализует токенизацию (с поддержкой кириллицы и стоп-слов), TF и cosine similarity по корпусу `KnowledgeArticle.content`. На выход: цитируемый ответ + топ-N статей. В UI ассистент показывает ссылки на источники — это позволяет показать «правильное» поведение RAG без бекенда. Подсистема обёрнута в `helpers.askAssistant`, который сохраняет диалог в `localStorage` и эмитит ChatMessages.

Точки замены:
1. `retrieve()` → вызов реального embeddings + векторного хранилища (pgvector / Qdrant).
2. `KnowledgeArticle.embeddingId` — заранее заведён под идентификатор вектора.
3. `helpers.askAssistant` — единая точка вызова, чтобы UI остался без изменений при переезде.

### Стейт-менеджмент

`StoreProvider` использует `useReducer` поверх обычного контекста — никаких сторонних библиотек состояния. Все мутации идут через action’ы (`UPDATE_TASK`, `ADD_TICKET`, ...), а после каждой мутации стейт автоматически сериализуется в `localStorage`.

Изменение статуса задачи автоматически пересчитывает прогресс тикета и обновляет соответствующие узлы Flow — UI и flowchart всегда консистентны.

### Дизайн-система

- Палитра: `kmg.navy / navy-light / navy-dark / gold / gold-light` плюс семантические `status.*`.
- Базовые компоненты в `components/ui` (shadcn-style) — Button, Card, Badge, Progress, Dialog, Dropdown, Select, Tabs, Tooltip, ScrollArea, Avatar, Separator.
- Утилиты: `gradient-navy`, `gradient-paper`, `glass-card`, `kpi-stat`, `section-title` в `app/globals.css`.

## Структура каталогов

```
app/
  layout.tsx                  # шрифт + StoreProvider + Tooltip
  page.tsx                    # лендинг + выбор демо-пользователя
  hr/
    layout.tsx                # AppShell context="hr"
    dashboard/                # KPI, прогресс сотрудников, активность
    tickets/[id]              # flowchart + чек-лист + аудит
    employees/[id]            # карточка сотрудника
    knowledge/                # база знаний для RAG
    assistant/                # AI-куратор
    settings, profile/
  employee/
    layout.tsx                # AppShell context="employee"
    dashboard/                # welcome + текущий этап + задачи
    journey/                  # composite-flow по всем тикетам
    tickets/[id]              # подробности тикета
    tasks/                    # вкладки pending/in_progress/done
    learning, knowledge, assistant, team, settings, profile/
components/
  brand/logo.tsx
  shell/                      # Sidebar, TopBar, AppShell
  flowchart/                  # node types + viewer + journey strip
  shared/                     # TicketCard, AiChat
  ui/                         # shadcn primitives
lib/
  types.ts                    # доменные модели
  seed.ts                     # демо-данные
  storage.ts                  # localStorage
  store.tsx                   # context + reducer + helpers
  rag.ts                      # TF-IDF retrieval (готово к замене)
  utils.ts                    # cn, formatDate, initials, uid
```

## Что дальше

- Подключить Anthropic Claude эмбеддинги вместо TF-IDF (см. `lib/rag.ts`).
- Перевести `localStorage` на API (Next.js Route Handlers) без изменения UI — все вызовы уже идут через `helpers`.
- Drag&drop досок Kanban на странице тикетов (`/hr/tickets`).
- SSO через KMG AD + RBAC по подразделениям.
- Локализация (RU/KZ/EN).
- Тёмная тема (CSS-переменные уже заведены).
