/**
 * ЕДИНСТВЕННОЕ МЕСТО ДЛЯ ВИДЕО.
 *
 * Каждое значение — это либо:
 *   • ссылка на YouTube (watch?v=…, youtu.be/…, /embed/…) — встроится через <iframe>;
 *   • локальный файл в проекте: путь `/videos/имя.mp4` (файл кладётся в `public/videos/`) —
 *     проиграется прямо в UI через нативный <video> (self-hosted, без YouTube).
 * Пустая строка "" — видео ещё нет, плеер покажет заглушку.
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  ВСТАВЛЯТЬ ССЫЛКИ/ПУТИ ТОЛЬКО ЗДЕСЬ ↓                                      │
 * │  Пример self-hosted: chairmanWelcome: "/videos/chairman.mp4"             │
 * └─────────────────────────────────────────────────────────────────────────┘
 */
export const VIDEO_LINKS = {
  /** День 1: видеообращение Председателя Правления КМГ (всплывает у Digital Buddy) */
  chairmanWelcome: "https://www.youtube.com/watch?v=Fc5CCmOT1k4",
  /** Курс «Корпоративные каналы и структура КМГ»: приветствие зам. Председателя Правления */
  viceChairmanWelcome: "https://www.youtube.com/watch?v=m7XuJGkOXyY",
  /** Курс «Стратегия КМГ 2030»: видение и ключевые направления */
  strategy2030: "https://www.youtube.com/watch?v=vwUWwI8Txmk",
  /** Курс HSE: вводное видео по технике безопасности */
  hseIntro: "https://www.youtube.com/watch?v=T-4qVOMrg6I"
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

export type VideoSource =
  | { type: "youtube"; embed: string }
  | { type: "file"; src: string };

/**
 * Определяет источник видео: YouTube (iframe) или локальный/прямой файл (<video>).
 * Локальным считается путь `/videos/...` или прямая ссылка на файл (.mp4/.webm/.ogg).
 */
export function videoSource(url: string | undefined): VideoSource | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  const embed = youtubeEmbed(trimmed);
  if (embed) return { type: "youtube", embed };

  const isFile =
    trimmed.startsWith("/") || /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(trimmed);
  if (isFile) return { type: "file", src: trimmed };

  return null;
}
