/**
 * Движок расписания онбординга (day-gated роадмап).
 *
 * Чистые данные и функции — без React и без store. Источник истины — ТЗ:
 *  §3   — пять этапов и их дни;
 *  §5.2.2 — банк из 23 карточек Culture Fit;
 *  §5.1–5.4 (F-01..F-31) — задачи/курсы/опросы/встречи по дням.
 *
 * Старт роадмапа = первое открытие портала (= День 1). Пользователь видит план
 * только на текущий день; остальное открывается по мере роста дня (unlockDay).
 */

export const PROBATION_DAYS = 90;

export interface Stage {
  id: string;
  name: string;
  tagline: string;
  /** включительные границы дней адаптации */
  range: [number, number];
  done?: boolean;
}

/** «Подготовка» уже реализована командой КМГ и идёт ДО Дня 1 — в роадмапе сотрудника
 *  она показывается как пройденный этап. Сотрудник стартует со «Знакомства».
 *  Четыре этапа сотрудника (ТЗ §3): Знакомство → Вовлечение → Адаптация → Закрепление. */
export const STAGES: Stage[] = [
  { id: "prep", name: "Подготовка", tagline: "За 2 недели до выхода", range: [-14, 0], done: true },
  { id: "intro", name: "Знакомство", tagline: "День 1", range: [1, 1] },
  { id: "engage", name: "Вовлечение", tagline: "Дни 2–30", range: [2, 30] },
  { id: "adapt", name: "Адаптация", tagline: "Месяц 1–3", range: [31, 89] },
  { id: "secure", name: "Закрепление", tagline: "Месяц 3–12", range: [90, 365] }
];

/** Этапы, видимые сотруднику (без «Подготовки»). */
export const EMPLOYEE_STAGES: Stage[] = STAGES.filter((s) => s.id !== "prep");

export function getStageForDay(day: number): Stage {
  return STAGES.find((s) => day >= s.range[0] && day <= s.range[1]) ?? STAGES[STAGES.length - 1];
}

export type StageStatus = "done" | "current" | "upcoming";

export function stageStatus(stage: Stage, day: number): StageStatus {
  if (day > stage.range[1]) return "done";
  if (day >= stage.range[0]) return "current";
  return "upcoming";
}

export type PlanKind = "video" | "task" | "course" | "survey" | "meeting" | "event";

export interface PlanItem {
  id: string;
  kind: PlanKind;
  title: string;
  description: string;
  /** день адаптации, когда пункт становится доступным («сегодня») */
  unlockDay: number;
  href?: string;
  /** источник ВНД для цитаты, если применимо */
  source?: string;
  priority?: "high" | "medium";
  /** для kind="course" — id курса из lib/courses.ts */
  courseId?: string;
}

/**
 * Расписание онбординга по дням. Замаплено на функциональные требования ТЗ —
 * код требования указан в описании, чтобы связь с ТЗ была прослеживаемой.
 */
export const SCHEDULE: PlanItem[] = [
  // ── День 1 · Знакомство (§5.1) ──────────────────────────────────────────────
  {
    id: "d1-video",
    kind: "video",
    title: "Видеообращение Председателя Правления КМГ",
    description: "Приветствие и ориентиры компании. Обязательно к просмотру в первый день. (F-02)",
    unlockDay: 1,
    href: "#video-chairman",
    priority: "high"
  },
  {
    id: "d1-tb",
    kind: "task",
    title: "Инструктаж по технике безопасности (ТБ)",
    description: "Пройдите инструктаж и тест. Дедлайн — конец дня 1. (F-03)",
    unlockDay: 1,
    source: "ПВТР",
    href: "/employee/learning",
    priority: "high"
  },
  {
    id: "d1-ib",
    kind: "task",
    title: "Инструктаж по информационной безопасности (ИБ)",
    description: "Пройдите инструктаж и тест. Дедлайн — конец дня 1. (F-04)",
    unlockDay: 1,
    href: "/employee/learning",
    priority: "high"
  },
  {
    id: "d1-pass",
    kind: "task",
    title: "Ознакомление с пропускным режимом",
    description: "Правила прохода и проксим-карта. Дедлайн — день 1. (F-05)",
    unlockDay: 1,
    priority: "high"
  },
  {
    id: "d1-codex",
    kind: "task",
    title: "Кодекс деловой этики",
    description: "Ознакомление и подтверждение. Дедлайн — день 1. (F-06)",
    unlockDay: 1,
    source: "Кодекс этики",
    href: "/employee/documents",
    priority: "high"
  },
  {
    id: "d1-compliance",
    kind: "task",
    title: "Модуль «Комплаенс»",
    description: "Антикоррупционная политика и линия доверия. Дедлайн — день 1. (F-07)",
    unlockDay: 1,
    source: "Комплаенс",
    priority: "high"
  },

  // ── Дни 2–30 · Вовлечение (§5.2) ────────────────────────────────────────────
  {
    id: "d2-welcome-coffee",
    kind: "event",
    title: "Welcome-кофe с командой",
    description: "Неформальное знакомство с коллегами подразделения.",
    unlockDay: 2
  },
  {
    id: "d2-course-hse",
    kind: "course",
    title: "Курс «Безопасность на производстве (HSE)»",
    description: "Обязательный курс по охране труда: видео, материалы и тест.",
    unlockDay: 2,
    href: "/employee/learning/hse",
    courseId: "hse",
    priority: "high"
  },
  {
    id: "d4-course-compliance",
    kind: "course",
    title: "Курс «Антикоррупционная политика и этика»",
    description: "Кодекс деловой этики, конфликт интересов и тест.",
    unlockDay: 4,
    href: "/employee/learning/compliance",
    courseId: "compliance",
    priority: "high"
  },
  {
    id: "d6-course-infosec",
    kind: "course",
    title: "Курс «Информационная безопасность»",
    description: "Пароли, доступы, фишинг и проверка знаний.",
    unlockDay: 6,
    href: "/employee/learning/infosec",
    courseId: "infosec",
    priority: "high"
  },
  {
    id: "d3-di",
    kind: "task",
    title: "Должностная инструкция и положение о подразделении",
    description: "Ознакомьтесь с ДИ и положением. Дедлайн — день 3. (F-10)",
    unlockDay: 3,
    href: "/employee/documents",
    priority: "high"
  },
  {
    id: "d4-office-tour",
    kind: "event",
    title: "Экскурсия по офису",
    description: "Где что находится: переговорные, столовая, зоны отдыха.",
    unlockDay: 4
  },
  {
    id: "d5-goals",
    kind: "task",
    title: "Цели на испытательный срок в КПД",
    description: "Сформулируйте цели совместно с руководителем. Дедлайн — день 5. (F-11)",
    unlockDay: 5,
    href: "/employee/mentorship",
    priority: "high"
  },
  {
    id: "d7-channels",
    kind: "course",
    title: "Курс «Корпоративные каналы и структура КМГ»",
    description: "Кто за что отвечает и где искать информацию. (F-12)",
    unlockDay: 7,
    href: "/employee/learning/kmg-structure",
    courseId: "kmg-structure"
  },
  {
    id: "d8-course-digital-ethics",
    kind: "course",
    title: "Курс «Цифровая этика и AI»",
    description: "Что можно и нельзя загружать в корпоративный AI-ассистент.",
    unlockDay: 8,
    href: "/employee/learning/digital-ethics",
    courseId: "digital-ethics",
    priority: "high"
  },
  {
    id: "d8-values-webinar",
    kind: "event",
    title: "Вебинар «Ценности КМГ»",
    description: "Онлайн-сессия о культуре и ценностях компании.",
    unlockDay: 8
  },
  {
    id: "d10-duchr",
    kind: "meeting",
    title: "Встреча с Директором ДУЧР",
    description: "Digital Buddy поможет подготовить вопросы заранее. (F-15)",
    unlockDay: 10
  },
  {
    id: "d12-mentor-1on1",
    kind: "meeting",
    title: "1:1 с наставником",
    description: "Обсудите первые впечатления и сложности.",
    unlockDay: 12
  },
  {
    id: "d14-pulse",
    kind: "survey",
    title: "Пульс-опрос 14-го дня",
    description: "3 коротких вопроса о первых двух неделях. (F-14)",
    unlockDay: 14,
    href: "/employee/feedback",
    priority: "high"
  },
  {
    id: "d16-conference",
    kind: "event",
    title: "Конференция KMG Digital Day",
    description: "Корпоративная конференция о цифровой трансформации.",
    unlockDay: 16
  },
  {
    id: "d21-learning",
    kind: "course",
    title: "Курс «Стратегия КМГ 2030»",
    description: "Видение, ключевые направления и видео. (F-13)",
    unlockDay: 21,
    href: "/employee/learning/strategy",
    courseId: "strategy"
  },
  {
    id: "d25-meetup",
    kind: "event",
    title: "Митап подразделения",
    description: "Внутренняя встреча команды: статусы и планы.",
    unlockDay: 25
  },
  {
    id: "d30-nps",
    kind: "survey",
    title: "Опрос удовлетворённости 30-го дня (NPS)",
    description: "NPS + открытый комментарий о первом месяце. (F-16)",
    unlockDay: 30,
    href: "/employee/feedback",
    priority: "high"
  },

  // ── Месяц 1–3 · Адаптация (§5.3) ────────────────────────────────────────────
  {
    id: "d33-1on1",
    kind: "meeting",
    title: "Встреча 1:1 с руководителем",
    description: "Digital Buddy предложит структуру разговора. (F-17, F-18)",
    unlockDay: 33
  },
  {
    id: "d35-smart",
    kind: "task",
    title: "Цели по SMART",
    description: "Сформулируйте цели на основе ДИ и КПД. (F-19)",
    unlockDay: 35,
    href: "/employee/mentorship"
  },
  {
    id: "d45-midterm",
    kind: "task",
    title: "Промежуточная оценка — подготовка",
    description: "Рекомендации по подготовке к оценке за неделю. (F-20)",
    unlockDay: 45,
    priority: "high"
  },
  {
    id: "d48-module",
    kind: "course",
    title: "Незавершённые обучающие модули",
    description: "Допройдите назначенные курсы. (F-23)",
    unlockDay: 48,
    href: "/employee/learning"
  },
  {
    id: "d60-goals-update",
    kind: "task",
    title: "Актуализировать цели в КПД",
    description: "После промежуточной оценки обновите цели. (F-22)",
    unlockDay: 60,
    href: "/employee/mentorship"
  },

  // ── Месяц 3 · Закрепление (§5.4) ────────────────────────────────────────────
  {
    id: "d83-final-prep",
    kind: "task",
    title: "Итоговая оценка — подготовка",
    description: "Рекомендации по подготовке к итоговой оценке за неделю. (F-28)",
    unlockDay: 83,
    priority: "high"
  },
  {
    id: "d90-final-nps",
    kind: "survey",
    title: "Финальный опрос NPS",
    description: "Итоги испытательного срока: NPS + комментарий. (F-29)",
    unlockDay: 90,
    href: "/employee/feedback",
    priority: "high"
  },
  {
    id: "d90-done",
    kind: "event",
    title: "Завершение испытательного срока 🎉",
    description: "Поздравляем — адаптация пройдена!",
    unlockDay: 90
  }
];

export interface CultureCard {
  day: number;
  theme: string;
  text: string;
  source: string;
}

/** 23 карточки Culture Fit, утверждённые ДУЧР (ТЗ §5.2.2). Используются без изменений. */
export const CULTURE_CARDS: CultureCard[] = [
  { day: 1, theme: "Деловой внешний вид", text: "Соблюдайте корпоративный дресс-код: аккуратность, сдержанность, деловой стиль.", source: "Правила дресс-кода" },
  { day: 2, theme: "Корректность и уважение", text: "Общайтесь профессионально, уважительно, избегайте фамильярности.", source: "Кодекс этики" },
  { day: 3, theme: "Дисциплина и рабочее время", text: "Приходите вовремя, соблюдайте график, эффективно используйте рабочее время.", source: "ПВТР" },
  { day: 4, theme: "Уведомление руководителя", text: "Сообщайте о планируемом отсутствии или опоздании заранее.", source: "ПВТР" },
  { day: 5, theme: "Уточнение поручений", text: "Если поручение неясно — задайте вопрос сразу.", source: "ПВТР" },
  { day: 6, theme: "Корпоративная переписка", text: "Пишите кратко, корректно, уважительно; соблюдайте деловой стиль.", source: "Кодекс этики" },
  { day: 7, theme: "Эффективные совещания", text: "Готовьтесь заранее, уважайте повестку, говорите по существу.", source: "Кодекс этики" },
  { day: 8, theme: "Умение слушать", text: "Слушайте коллег внимательно, не перебивайте.", source: "Кодекс этики" },
  { day: 9, theme: "Работа с документами", text: "Используйте корпоративные шаблоны, проверяйте оформление.", source: "ПВТР" },
  { day: 10, theme: "Конфиденциальность", text: "Не оставляйте документы без присмотра, не обсуждайте рабочие темы вне офиса.", source: "ПВТР" },
  { day: 11, theme: "Проверка получателей", text: "Перед отправкой писем проверяйте правильность адресатов.", source: "ПВТР" },
  { day: 12, theme: "Прозрачность поведения", text: "При сомнениях обращайтесь к руководителю или Комплаенс.", source: "Комплаенс" },
  { day: 13, theme: "Конфликты интересов", text: "Сообщайте о пересечениях личных и рабочих интересов.", source: "Комплаенс" },
  { day: 14, theme: "Представительство от КМГ", text: "Нельзя выступать от имени компании без официальных полномочий.", source: "Кодекс этики" },
  { day: 15, theme: "Инструктажи и безопасность", text: "Соблюдайте правила ТБ/ПБ/ИБ — это часть вашей ответственности.", source: "ПВТР" },
  { day: 16, theme: "Запрет на агрессию и опьянение", text: "Опьянение и угрожающие действия строго запрещены.", source: "ПВТР" },
  { day: 17, theme: "Офисный этикет", text: "Поддерживайте порядок в офисе и бережно относитесь к имуществу.", source: "ПВТР" },
  { day: 18, theme: "Репутация сотрудника", text: "Ваше поведение влияет на репутацию КМГ и доверие коллег.", source: "Кодекс этики" },
  { day: 19, theme: "Профессиональное развитие", text: "Поддерживайте и развивайте свои профессиональные навыки.", source: "Кодекс этики" },
  { day: 20, theme: "Smart Casual по пятницам", text: "Более свободный стиль допускается, но в рамках корпоративных норм.", source: "Правила дресс-кода" },
  { day: 21, theme: "Корректность при звонках", text: "Говорите вежливо, представляйтесь, соблюдайте деловой тон.", source: "Кодекс этики" },
  { day: 22, theme: "Обновление личных данных", text: "При смене персональных данных своевременно уведомляйте HR.", source: "ПВТР" },
  { day: 23, theme: "Материальная ответственность", text: "Бережно относитесь к ресурсам компании — за ущерб предусмотрена материальная ответственность.", source: "ПВТР" }
];

export function getCultureCard(day: number): CultureCard | undefined {
  return CULTURE_CARDS.find((c) => c.day === day);
}

export function getPlanItem(id: string): PlanItem | undefined {
  return SCHEDULE.find((i) => i.id === id);
}

export function getPlanItemByCourse(courseId: string): PlanItem | undefined {
  return SCHEDULE.find((i) => i.courseId === courseId);
}

export interface DayPlan {
  day: number;
  stage: Stage;
  /** задачи/курсы/опросы/видео, доступные именно сегодня */
  today: PlanItem[];
  /** события и встречи сегодня (напоминания) */
  events: PlanItem[];
  /** карточка корпоративной культуры дня (дни 1–23) */
  card?: CultureCard;
  /** ближайшие пункты на следующие 7 дней (заблокированы) */
  upcoming: PlanItem[];
}

const REMINDER_KINDS: PlanKind[] = ["event", "meeting"];

export function getDayPlan(day: number): DayPlan {
  const today = SCHEDULE.filter((i) => i.unlockDay === day);
  const upcoming = SCHEDULE.filter((i) => i.unlockDay > day && i.unlockDay <= day + 7).sort(
    (a, b) => a.unlockDay - b.unlockDay
  );
  return {
    day,
    stage: getStageForDay(day),
    today: today.filter((i) => !REMINDER_KINDS.includes(i.kind)),
    events: today.filter((i) => REMINDER_KINDS.includes(i.kind)),
    card: getCultureCard(day),
    upcoming
  };
}

/** Все обязательные пункты, открытые к этому дню включительно (для расчёта прогресса). */
export function unlockedItems(day: number): PlanItem[] {
  return SCHEDULE.filter((i) => i.unlockDay <= day && !REMINDER_KINDS.includes(i.kind));
}

export const PLAN_KIND_LABEL: Record<PlanKind, string> = {
  video: "Видео",
  task: "Задача",
  course: "Курс",
  survey: "Опрос",
  meeting: "Встреча",
  event: "Событие"
};
