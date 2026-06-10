/**
 * Контент Digital Buddy — гида-компаньона (НЕ ИИ-инструмент).
 *
 * Digital Buddy объясняет флоу и разделы, напоминает о событиях и подбадривает.
 * Тон: дружелюбный, поддерживающий, на «вы». Имя всегда «Digital Buddy» (ТЗ §4.2).
 * Вопросы по ВНД он передаёт в RAG-чат «AI-Ассистент» (/employee/assistant).
 */

import { VIDEO_LINKS } from "./media";

export const BUDDY_NAME = "Digital Buddy";

/** Ссылка вставляется в lib/media.ts (VIDEO_LINKS.chairmanWelcome). */
export const CHAIRMAN_VIDEO_URL = VIDEO_LINKS.chairmanWelcome || "#video-chairman";

/** Короткая фраза-подбадривание для конкретного дня (ротация, детерминированно). */
const MOTIVATION = [
  "Рад видеть вас снова! Сегодня сделаем ещё один шаг 💪",
  "Вы отлично справляетесь. Маленькие шаги каждый день — и вы у цели.",
  "Не спешите: важно не количество, а понимание. Я рядом, если что 🤝",
  "Каждый закрытый пункт приближает вас к уверенному старту в КМГ.",
  "Сегодня хороший день, чтобы разобраться ещё с одной темой 🌟",
  "Вы здесь не одни — команда и я поможем освоиться.",
  "Помните: вопросы — это нормально. Спросить лучше, чем гадать."
];

export function buddyLineForDay(day: number): string {
  if (day <= 0) return MOTIVATION[0];
  return MOTIVATION[(day - 1) % MOTIVATION.length];
}

/** Приветствие Дня 1 — контекстное окно (ТЗ §5.1.3). */
export function day1Greeting(firstName: string): { title: string; body: string } {
  return {
    title: `Отлично, ${firstName}, начинаем День 1!`,
    body: "Теперь вы знаете, что где находится. Сегодня важно выполнить задачи первого дня по порядку: начните с просмотра видеообращения Председателя Правления, затем пройдите инструктажи (ТБ, ИБ) и остальные пункты. Каждый следующий пункт открывается после предыдущего — я рядом, если понадоблюсь."
  };
}

export type TutorialPlacement = "right" | "left" | "top" | "bottom" | "center";

export interface TutorialStep {
  /** CSS-селектор реального элемента портала (data-tour=...). Пусто — центр экрана. */
  target?: string;
  title: string;
  body: string;
  placement: TutorialPlacement;
  mood?: "happy" | "wave" | "point" | "cheer";
}

/**
 * Игровой туториал: Digital Buddy «перемещается» от кнопки к кнопке и подсвечивает
 * реальные элементы портала, объясняя, что за что отвечает (как обучение в игре).
 * Селекторы указывают на data-tour атрибуты в sidebar / top-bar / лаунчере.
 */
export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    title: "Привет! Я — Digital Buddy",
    body: "Буду вашим гидом по порталу весь испытательный срок. Давайте за минуту разберёмся, что где находится. Нажимайте «Далее».",
    placement: "center",
    mood: "wave"
  },
  {
    target: '[data-tour="/employee/dashboard"]',
    title: "«Мой день»",
    body: "Главный экран. Сюда вы возвращаетесь каждый день: план на сегодня, задачи и напоминания. Ничего лишнего — только то, что важно сейчас.",
    placement: "right",
    mood: "point"
  },
  {
    target: '[data-tour="/employee/journey"]',
    title: "«Мой путь»",
    body: "Вся карта адаптации: Знакомство → Вовлечение → Адаптация → Закрепление. Видно, что пройдено и что впереди.",
    placement: "right",
    mood: "point"
  },
  {
    target: '[data-tour="/employee/tasks"]',
    title: "«Задачи»",
    body: "Полный список дел со сроками и статусами. «Мой день» показывает срочное, а здесь — вся картина.",
    placement: "right",
    mood: "point"
  },
  {
    target: '[data-tour="/employee/calendar"]',
    title: "«Календарь»",
    body: "Встречи 1:1, корпоративные события и конференции. Я заранее напомню о ближайших.",
    placement: "right",
    mood: "point"
  },
  {
    target: '[data-tour="/employee/assistant"]',
    title: "«AI-Ассистент»",
    body: "Нужен точный ответ по регламенту (ВНД) со ссылкой на документ? Спросите здесь — или прямо у меня в чате.",
    placement: "right",
    mood: "point"
  },
  {
    target: '[data-tour="notifications"]',
    title: "Уведомления",
    body: "Колокольчик вверху — все важные события и напоминания. Я подскажу, когда здесь появится что-то новое.",
    placement: "bottom",
    mood: "point"
  },
  {
    target: '[data-tour="buddy-launcher"]',
    title: "А это — я",
    body: "Нажмите на меня в любой момент: подскажу по разделам, напомню о задачах или открою чат, если есть вопрос.",
    placement: "top",
    mood: "wave"
  },
  {
    title: "Готово! 🚀",
    body: "Теперь вы знаете, как устроен портал. Начнём ваш День 1 — я рядом, если что.",
    placement: "center",
    mood: "cheer"
  }
];

/** Факты о компании — Digital Buddy иногда делится ими для мотивации (ТЗ §4.1). */
export const COMPANY_TIPS = [
  "КМГ — национальный оператор Казахстана в нефтегазовой отрасли, охватывает весь цикл от разведки до переработки.",
  "В группу КМГ входит более 50 дочерних предприятий — около 80 000 сотрудников.",
  "Ценности КМГ: безопасность, ответственность, прозрачность, эффективность и развитие людей.",
  "Культура КМГ поощряет открытость — не стесняйтесь задавать вопросы коллегам и руководителю.",
  "По пятницам допускается Smart Casual — но в рамках корпоративных норм 😊"
];

export type BuddyReminderKind = "nudge" | "tasks" | "done" | "notifications" | "tip";

export interface BuddyReminder {
  kind: BuddyReminderKind;
  text: string;
}

/**
 * Роль Digital Buddy (ТЗ §4): напомнить о незакрытой задаче дня, о новых уведомлениях,
 * иногда — мотивация и факт о компании. Возвращает самое релевантное напоминание.
 */
export function getBuddyReminder(input: {
  day: number;
  todayTotal: number;
  todayDone: number;
  hasUnseenNudge: boolean;
  unread: number;
}): BuddyReminder {
  const { day, todayTotal, todayDone, hasUnseenNudge, unread } = input;

  if (hasUnseenNudge) {
    return { kind: "nudge", text: "Загляните — карточка корпоративной культуры на сегодня уже ждёт вас 🎴" };
  }
  if (todayTotal > 0 && todayDone < todayTotal) {
    const left = todayTotal - todayDone;
    return {
      kind: "tasks",
      text: `На сегодня осталось задач: ${left} из ${todayTotal}. Давайте закроем их вместе — отметьте выполненное галочкой.`
    };
  }
  if (todayTotal > 0 && todayDone === todayTotal) {
    return { kind: "done", text: "Все задачи на сегодня выполнены — отличная работа! 🎉" };
  }
  if (unread > 0) {
    return { kind: "notifications", text: "Не забудьте заглянуть в уведомления — там есть кое-что важное." };
  }
  return { kind: "tip", text: COMPANY_TIPS[(Math.max(1, day) - 1) % COMPANY_TIPS.length] };
}
