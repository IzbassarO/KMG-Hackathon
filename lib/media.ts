/**
 * ЕДИНСТВЕННОЕ МЕСТО ДЛЯ ССЫЛОК НА ВИДЕО.
 *
 * Вставьте сюда ссылки на YouTube (можно в любом формате: watch?v=…, youtu.be/…,
 * или уже /embed/…). Пустая строка "" — видео ещё нет, плеер покажет заглушку.
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  ВСТАВЛЯТЬ ССЫЛКИ ТОЛЬКО ЗДЕСЬ ↓                                          │
 * └─────────────────────────────────────────────────────────────────────────┘
 */
export const VIDEO_LINKS = {
  /** День 1: видеообращение Председателя Правления КМГ (всплывает у Digital Buddy) */
  chairmanWelcome: "",
  /** Курс «Корпоративные каналы и структура КМГ»: приветствие зам. Председателя Правления */
  viceChairmanWelcome: "",
  /** Курс «Стратегия КМГ 2030»: видение и ключевые направления */
  strategy2030: "",
  /** Курс HSE: вводное видео по технике безопасности */
  hseIntro: ""
};

export type VideoKey = keyof typeof VIDEO_LINKS;

/**
 * Преобразует ссылку YouTube в embed-URL для <iframe>. Возвращает null, если ссылки нет.
 */
export function youtubeEmbed(url: string | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (trimmed.includes("/embed/")) return trimmed;

  let id = "";
  const watch = trimmed.match(/[?&]v=([\w-]{11})/);
  const short = trimmed.match(/youtu\.be\/([\w-]{11})/);
  const shorts = trimmed.match(/shorts\/([\w-]{11})/);
  if (watch) id = watch[1];
  else if (short) id = short[1];
  else if (shorts) id = shorts[1];
  else if (/^[\w-]{11}$/.test(trimmed)) id = trimmed;

  return id ? `https://www.youtube.com/embed/${id}` : null;
}
