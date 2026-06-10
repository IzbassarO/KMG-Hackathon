/**
 * Sentiment-аналитика сотрудников (ТЗ §5.4): тональность переписки с Digital Buddy,
 * тревожность, вовлечённость, динамика по неделям и флаг at_risk.
 *
 * Данные детерминированы по userId (стабильны между рендерами, без Math.random
 * в рендере), профили отличаются у разных сотрудников.
 */

import { clamp } from "./utils";

export type SentimentLabel = "positive" | "neutral" | "negative";

export interface SentimentProfile {
  score: number; // 0..100
  label: SentimentLabel;
  positive: number; // % распределение
  neutral: number;
  negative: number;
  engagement: number; // 0..100
  anxiety: number; // 0..100
  trend: number[]; // 8 недель
  atRisk: boolean;
  dominantTone: string;
  messagesAnalyzed: number;
  signals: string[];
}

// Небольшое смещение для демо-сотрудников, чтобы профили были разными и наглядными.
const BIAS: Record<string, number> = {
  u_emp_geo: 16, // позитивный
  u_emp_eng: 3, // нейтрально-позитивный
  u_emp_fin: -26 // в зоне риска
};

const SIGNALS: Record<SentimentLabel, string[]> = {
  positive: [
    "Высокая вовлечённость в чате Digital Buddy",
    "Позитивные формулировки в переписке",
    "Активно задаёт вопросы по задачам",
    "Стабильно проходит ежедневные карточки культуры"
  ],
  neutral: [
    "Ровная тональность переписки",
    "Умеренная активность в портале",
    "Нейтральные формулировки в сообщениях"
  ],
  negative: [
    "Снижение активности за последнюю неделю",
    "Тревожные формулировки в сообщениях",
    "Пропуск ежедневных карточек культуры",
    "Участились просьбы о помощи"
  ]
};

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function getSentiment(userId: string): SentimentProfile {
  const rng = mulberry32(hashStr(userId));
  const bias = BIAS[userId] ?? Math.round((rng() - 0.5) * 28);
  const score = clamp(Math.round(64 + bias + (rng() - 0.5) * 14), 8, 96);
  const label: SentimentLabel = score >= 62 ? "positive" : score >= 46 ? "neutral" : "negative";

  let positive = clamp(Math.round(score - 6 + (rng() - 0.5) * 10), 6, 92);
  let negative = clamp(Math.round((100 - score) * 0.62 + (rng() - 0.5) * 8), 2, 58);
  const total = positive + negative + Math.max(2, 100 - positive - negative);
  positive = Math.round((positive / total) * 100);
  negative = Math.round((negative / total) * 100);
  const neutral = clamp(100 - positive - negative, 0, 100);

  const engagement = clamp(Math.round(score + (rng() - 0.5) * 12), 12, 98);
  const anxiety = clamp(Math.round((100 - score) * 0.7 + (rng() - 0.5) * 10), 2, 82);
  const atRisk = score < 46 || negative > 34;

  const trend = Array.from({ length: 8 }, () => clamp(Math.round(score + (rng() - 0.5) * 24), 6, 98));
  trend[trend.length - 1] = score;

  const dominantTone =
    label === "positive" ? "Позитивная" : label === "neutral" ? "Нейтральная" : "Тревожная";
  const signals = SIGNALS[label].slice(0, atRisk ? 3 : 2);
  const messagesAnalyzed = 24 + Math.floor(rng() * 130);

  return {
    score,
    label,
    positive,
    neutral,
    negative,
    engagement,
    anxiety,
    trend,
    atRisk,
    dominantTone,
    messagesAnalyzed,
    signals
  };
}

export const SENTIMENT_META: Record<
  SentimentLabel,
  { ru: string; badge: "success" | "navy" | "danger"; bar: string; color: string }
> = {
  positive: { ru: "Позитивная", badge: "success", bar: "bg-emerald-500", color: "#0E9F6E" },
  neutral: { ru: "Нейтральная", badge: "navy", bar: "bg-sky-500", color: "#2563EB" },
  negative: { ru: "Негативная", badge: "danger", bar: "bg-red-500", color: "#DC2626" }
};
