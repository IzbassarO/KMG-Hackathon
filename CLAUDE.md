# Контекст проекта для Claude Code

Этот файл читается автоматически при старте Claude Code в этом репо. В нём — всё, что нужно знать, чтобы продолжить работу без потери контекста.

## Что это

**KMG Onboarding Portal** — прототип хакатона для АО НК «КазМунайГаз». Корпоративный портал онбординга с двумя ролями (HR и сотрудник), визуальными flowchart-тикетами и AI-ассистентом на RAG.

Полный обзор фич, маршруты и архитектура — в `README.md`.

## Стек и решения

- **Next.js 15 (App Router) + React 19 + TypeScript** — серверный/клиентский рендеринг по умолчанию через `"use client"`.
- **TailwindCSS** + кастомные shadcn/ui-стайл примитивы в `components/ui/`. Не подключать сторонние UI-киты — все компоненты собраны вручную под корпоративную палитру KMG.
- **State**: только React Context + `useReducer` (`lib/store.tsx`). Никаких Zustand, Redux, Jotai. Авто-персист в `localStorage` через `lib/storage.ts`.
- **Flowchart**: `@xyflow/react@12`. Кастомные node-типы в `components/flowchart/nodes.tsx`. Node-data должна расширять `Record<string, unknown>` — см. тип `FlowReactNode`.
- **RAG**: TF-IDF + cosine similarity в `lib/rag.ts`. Это заглушка. Точка замены — функция `retrieve()`. Когда подключим Claude embeddings + pgvector, UI менять не нужно, всё проходит через `helpers.askAssistant()`.
- **Графики**: кастомные SVG в `components/charts/` (Donut, BarChart, Sparkline). Не ставить recharts/chart.js.
- **Иконки**: только `lucide-react`.
- **Без бэкенда**: всё на `localStorage`. Ключ — `kmg.onboarding.portal/v1`.

## Структура

```
app/                   # App Router маршруты
  layout.tsx           # StoreProvider + TooltipProvider + Inter
  page.tsx             # Лендинг с выбором роли
  hr/                  # 12 разделов HR-консоли
  employee/            # 15 разделов сотрудника
components/
  brand/               # KmgLogo
  shell/               # Sidebar, TopBar, AppShell
  flowchart/           # nodes, viewer, journey-strip
  shared/              # TicketCard, AiChat, CalendarView,
                       # CreateTicketDialog, NotificationsSheet,
                       # WelcomeWizard
  charts/              # Donut, BarChart, Sparkline
  ui/                  # 16 shadcn-style примитивов
lib/
  types.ts             # Доменные модели
  seed.ts              # Демо-данные
  storage.ts           # localStorage I/O
  store.tsx            # Reducer + helpers + Provider
  rag.ts               # TF-IDF retrieval
  utils.ts             # cn, formatDate, initials, uid
```

## Демо-аккаунты

В `lib/seed.ts`:

- **HR**: Айгерим Сатпаева (`u_hr_director`), Нурлан Жумабаев (`u_hr_lead`)
- **Сотрудники**: Асылбек Гизатов (`u_emp_geo`), Алия Бектурова (`u_emp_eng`), Олжас Смагулов (`u_emp_fin`)

6 тикетов по 6 категориям: documents, access, training, equipment, compliance, mentorship.

## Конвенции кода

- **Server vs Client**: страницы по умолчанию client (`"use client"`) — нужен доступ к `useStore`. Никаких server actions пока нет.
- **Импорты**: алиас `@/*` ведёт в корень. Не использовать относительные пути глубже одного уровня.
- **Стили**: только классы Tailwind. Палитра KMG в `tailwind.config.ts` (`kmg.navy`, `kmg.gold`, `kmg.ink`, `kmg.paper`, `kmg.mist`). Семантические — через CSS-переменные в `app/globals.css`.
- **Локаль**: всё на русском (UI и комментарии). Даты через `formatDate(..., "ru-RU")`.
- **Иконки**: импорт по имени из `lucide-react`. Размеры — `h-4 w-4` / `h-5 w-5`.
- **Бейджи статусов**: использовать `<Badge variant="navy|gold|success|warning|danger|info|secondary|outline">`.
- **Никаких комментариев в коде** кроме случаев, где нужно объяснить неочевидное решение.

## Скрипты

```bash
npm run dev          # dev на :3000
npm run build        # production-сборка (должна проходить)
npm run typecheck    # tsc --noEmit (должно быть 0 ошибок)
npm run lint         # next lint
```

После изменений всегда прогонять `npm run typecheck` перед коммитом.

## Известные ограничения

- `next-env.d.ts` — изменяется линтером, не править вручную.
- Push в `IzbassarO/KMG-Hackathon` блокируется 403 — нужен GitHub App с write-доступом.
- Уязвимость в Next.js 15.1.3 — обновить до `15.1.8` (`npm install next@15.1.8`).

## Что делали в предыдущих сессиях

1. **Сессия 1 (web)**: подняли архитектуру — Store, RAG-заглушка, flowchart, базовые страницы для HR и сотрудника, дизайн-система KMG.
2. **Сессия 2 (web)**: добавили функциональное создание тикетов с конструктором flow, аналитику с SVG-графиками, календарь, документы, менторство 30/60/90, FAQ, welcome-wizard, фидбэк-пульс, расширили обучение.

## Что можно добавить дальше

- Подключить реальные эмбеддинги Claude в `lib/rag.ts`.
- Drag&drop на Kanban-доске `/hr/tickets` (использовать `dnd-kit`).
- SSO + Active Directory.
- Локализация RU/KZ/EN (next-intl).
- Тёмная тема (CSS-переменные уже подготовлены).
- Live-обновления (WebSocket / SSE).
- E2E-тесты (Playwright).
