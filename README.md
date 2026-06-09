# KMG Onboarding Portal

Корпоративный портал онбординга для АО НК «КазМунайГаз». Прототип хакатона.

Стек: **Next.js 15 (App Router) · TypeScript · TailwindCSS · shadcn/ui · @xyflow/react · React Context + useReducer**. Состояние полностью персистится в `localStorage` — backend не требуется. RAG-подсистема собрана как заглушка с TF-IDF поиском и точкой замены на боевые эмбеддинги.

## Запуск

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # production-сборка
npm run typecheck    # проверка типов
```

На главной — лендинг с выбором роли HR / Сотрудник и демо-аккаунтами. Всё в браузере.

## Возможности

### HR-консоль (`/hr/*`)

| Раздел | Описание |
| --- | --- |
| `dashboard` | KPI, прогресс сотрудников, RAG-метрики, активность |
| `tickets` | Flowchart-тикеты: Kanban-лейны, фильтры, модальное создание |
| `tickets/[id]` | Полный flowchart, чек-лист задач, аудит |
| `employees` | Список + детальная страница сотрудника с тикетами |
| `mentorship` | Программы 30/60/90, пары наставник↔сотрудник, пул менторов |
| `calendar` | Месяц-вид: дедлайны, старты сотрудников, kick-off |
| `reports` | Аналитика: donut статусов, bar по категориям, sparkline, SLA-таблица |
| `documents` | Реестр документов с фильтрами, поиском и привязкой к сотруднику |
| `knowledge` | База знаний для RAG и индикаторы готовности RAG-стека |
| `assistant` | AI-куратор с RAG-цитированием |
| `settings`, `profile` | Конфигурация и личные данные |

### Портал сотрудника (`/employee/*`)

| Раздел | Описание |
| --- | --- |
| `dashboard` | Welcome-баннер, счётчик дней, текущий этап, ближайшие задачи |
| `journey` | Composite-flow по всем тикетам + детальные карточки |
| `tickets/[id]` | Полный flowchart с интерактивным завершением задач |
| `tasks` | Вкладки `pending` / `in_progress` / `done` со счётчиками |
| `calendar` | Личный календарь задач и дедлайнов |
| `mentorship` | План 30/60/90 с целями, контрольные точки, карточка ментора |
| `learning` | Курсы (обязательные/рекомендуемые/бонус), сертификаты, достижения |
| `documents` | Drag&drop загрузка, чек-лист, шаблоны |
| `knowledge` | Поиск по корпоративной базе знаний |
| `assistant` | AI-ассистент с цитированием |
| `team` | Руководитель и коллеги отдела |
| `feedback` | Пульс-опросы, оценка настроения, идеи |
| `help` | FAQ с категориями + контакты поддержки |
| `settings`, `profile` | Уведомления, язык, тема, сброс прогресса |

### Общие фичи

- **Welcome-wizard** — 4-шаговая onboarding-вспышка при первом входе сотрудника, запоминается в `localStorage`.
- **Notifications drawer** — slide-in панель из колокольчика с лентой активности.
- **Mobile-меню** — Sidebar открывается из бургер-кнопки на узких экранах.
- **CreateTicketDialog** — модалка с конструктором flowchart-шагов (тип, роль, оценка в днях), сразу попадает в Kanban и `localStorage`.
- **AI-чат** — единый компонент, переиспользуется HR и сотрудником, опирается на `lib/rag.ts`.

## Архитектура (высокий уровень)

```
┌─────────────────────────────────────────────────────────────────┐
│                          UI (Next.js App)                       │
│   /  →  лендинг + выбор роли                                    │
│   /hr/*       — HR-консоль (12 разделов)                         │
│   /employee/* — рабочее место сотрудника (15 разделов)           │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                  StoreProvider (lib/store.tsx)                  │
│   useReducer + контекст; помощники createTicket / advanceTask / │
│   askAssistant / logActivity. Auto-persist в localStorage.      │
└─────────┬────────────────────────────────────────┬──────────────┘
          │                                        │
          ▼                                        ▼
┌─────────────────────┐                ┌────────────────────────┐
│  localStorage I/O   │                │  RAG (lib/rag.ts)       │
│  lib/storage.ts     │                │  TF-IDF + cosine,        │
│  key:                │                │  цитирование, готов     │
│  kmg.onboarding.    │                │  к замене на эмбеддинги │
│  portal/v1          │                │  Claude + pgvector       │
└─────────────────────┘                └────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Seed (lib/seed.ts)                        │
│  5 пользователей, 6 flowchart-тикетов по 6 категориям,          │
│  6 KB-статей, активность, демо-чат.                              │
└─────────────────────────────────────────────────────────────────┘
```

### Слой данных (`lib/types.ts`)

- **User** (`hr | employee`)
- **Ticket** + **Flow** (nodes/edges) — единица процесса онбординга
- **OnboardingTask** — задача, привязанная к узлу flow
- **KnowledgeArticle** — источник для RAG
- **ChatSession / ChatMessage** — диалог с AI
- **ActivityEvent** — журнал событий

### Flowchart-тикеты

`components/flowchart/*` — реализация на `@xyflow/react@12`. Узлы шести типов: `start | task | approval | milestone | decision | end`. Каждый стилизован под корпоративную палитру KMG и показывает статус (pending/active/done/blocked), ответственного и оценку. На странице тикета доступны вкладки **Flowchart / Задачи / Комментарии / Аудит**.

`components/shared/ticket-card.tsx` — превью тикета с бейджами, прогрессом и SLA, который ведёт на полный flowchart по клику. **Конструктор `CreateTicketDialog`** позволяет HR собирать новый процесс с произвольным числом шагов.

### RAG-стек (заглушка)

`lib/rag.ts` реализует токенизацию (с поддержкой кириллицы и стоп-слов), TF и cosine similarity по корпусу `KnowledgeArticle.content`. На выход: цитируемый ответ + топ-N статей. В UI ассистент показывает ссылки на источники.

Точки замены:
1. `retrieve()` → вызов реального embeddings + векторного хранилища (pgvector / Qdrant).
2. `KnowledgeArticle.embeddingId` — заранее заведён под идентификатор вектора.
3. `helpers.askAssistant` — единая точка вызова, чтобы UI остался без изменений при переезде.

### Графики без внешних библиотек

`components/charts/` — кастомные SVG-компоненты:

- `Donut` — статусы тикетов
- `BarChart` — категории и сравнение метрик
- `Sparkline` — динамика активности

### Стейт-менеджмент

`StoreProvider` использует `useReducer` поверх обычного контекста — никаких сторонних библиотек состояния. Все мутации идут через action’ы (`UPDATE_TASK`, `ADD_TICKET`, ...), а после каждой мутации стейт автоматически сериализуется в `localStorage`.

Изменение статуса задачи автоматически пересчитывает прогресс тикета и обновляет соответствующие узлы Flow — UI и flowchart всегда консистентны.

### Дизайн-система

- Палитра: `kmg.navy / navy-light / navy-dark / gold / gold-light` плюс семантические `status.*`.
- Базовые компоненты в `components/ui` (shadcn-style): Button, Card, Badge, Progress, Dialog, Sheet, Dropdown, Select, Tabs, Tooltip, ScrollArea, Avatar, Separator, Label, Input, Textarea.
- Утилиты: `gradient-navy`, `gradient-paper`, `glass-card`, `kpi-stat`, `section-title` в `app/globals.css`.
- Inter с поддержкой кириллицы, корпоративные градиенты, тонкие анимации.

## Структура каталогов

```
app/
  layout.tsx                  # шрифт + StoreProvider + Tooltip
  page.tsx                    # лендинг + выбор демо-пользователя
  hr/                         # 12 разделов HR-консоли
  employee/                   # 15 разделов рабочего места сотрудника
components/
  brand/logo.tsx
  shell/                      # Sidebar, TopBar, AppShell
  flowchart/                  # node types + viewer + journey strip
  shared/                     # TicketCard, AiChat, CalendarView,
                              # CreateTicketDialog, NotificationsSheet,
                              # WelcomeWizard
  charts/                     # Donut, BarChart, Sparkline
  ui/                         # shadcn primitives (16 компонентов)
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
- Push-уведомления и интеграции (MS Teams, Slack).
- Live-обновления через WebSocket / SSE.
