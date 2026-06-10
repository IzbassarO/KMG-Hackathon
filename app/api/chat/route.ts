import { NextResponse } from "next/server";
import { CULTURE_CARDS } from "@/lib/program";

/**
 * Чат Digital Buddy — серверный прокси к Groq LLM (порт логики ai-module/digital_buddy.py).
 *
 * Ключ GROQ_API_KEY читается ТОЛЬКО на сервере (из .env.local) и НЕ попадает в браузер.
 * Если ключа нет — возвращаем configured:false, и клиент использует локальную TF-IDF заглушку.
 *
 * Используется всеми чатами: AI-Ассистент (HR и сотрудник) и чат-модалка Digital Buddy.
 */

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-zа-яё0-9\s]/giu, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

/** Ранжируем 23 ВНД-карточки по совпадению ключевых слов (как retrieve в digital_buddy.py). */
function rankCards(question: string, k = 3) {
  const qt = new Set(tokenize(question));
  return [...CULTURE_CARDS]
    .map((c) => {
      const ct = tokenize(`${c.theme} ${c.text} ${c.source}`);
      const score = ct.reduce((n, w) => n + (qt.has(w) ? 1 : 0), 0);
      return { card: c, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}

export async function POST(req: Request) {
  let question = "";
  try {
    const body = await req.json();
    question = (body?.question ?? "").toString().trim();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  if (!question) return NextResponse.json({ error: "empty_question" }, { status: 400 });

  const key = process.env.GROQ_API_KEY;
  if (!key) {
    // Ключ не задан — клиент откатится на локальную заглушку.
    return NextResponse.json({ answer: null, configured: false });
  }

  const ranked = rankCards(question);
  const context = ranked
    .map(({ card }) => `День ${card.day}: ${card.theme}\n${card.text} (Источник: ${card.source})`)
    .join("\n\n");

  const system = `Ты — Digital Buddy, корпоративный ассистент по онбордингу компании КМГ (КазМунайГаз).

ОБЛАСТЬ ОТВЕТОВ — СТРОГО:
- Отвечай ТОЛЬКО на вопросы, связанные с КМГ, работой сотрудника, онбордингом и адаптацией,
  корпоративными процессами, регламентами, ВНД, политиками, рабочими инструментами и
  карьерой в компании.
- Если вопрос НЕ относится к работе в КМГ или к корпоративным темам (общие знания, новости,
  развлечения, личные или политические темы, рецепты, не связанное с работой программирование,
  и т.п.) — НЕ отвечай по существу. Вежливо сообщи (НА ЯЗЫКЕ ВОПРОСА), что ты можешь помогать
  только с вопросами, связанными с работой и адаптацией в КМГ, и предложи задать вопрос по этой теме.

ПРАВИЛА:
- Отвечай на языке вопроса (русский, казахский или английский).
- Будь дружелюбным и профессиональным.
- Используй переданный контекст из ВНД; если информации недостаточно — предложи обратиться
  к руководителю или HR.`;

  const userMsg = `КОНТЕКСТ ИЗ ВНД:
${context}

ВОПРОС СОТРУДНИКА:
${question}`;

  try {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: system },
          { role: "user", content: userMsg }
        ],
        temperature: 0.5,
        max_tokens: 1024
      })
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: "groq_error", detail: text.slice(0, 300) },
        { status: 502 }
      );
    }

    const data = await res.json();
    const answer: string | undefined = data?.choices?.[0]?.message?.content;
    if (!answer) return NextResponse.json({ error: "no_answer" }, { status: 502 });

    return NextResponse.json({
      answer,
      // Цитаты показываем только если вопрос реально пересёкся с ВНД (иначе — отказ без источников).
      sources: ranked
        .filter((r) => r.score > 0)
        .map(({ card }) => ({ day: card.day, title: card.theme, source: card.source }))
    });
  } catch (err) {
    return NextResponse.json(
      { error: "request_failed", detail: String(err).slice(0, 200) },
      { status: 502 }
    );
  }
}
