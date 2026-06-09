import type { ChatMessage, KnowledgeArticle } from "./types";

const stopWords = new Set([
  "и",
  "в",
  "на",
  "с",
  "по",
  "для",
  "как",
  "что",
  "это",
  "у",
  "к",
  "от",
  "из",
  "the",
  "and",
  "of",
  "to",
  "for",
  "a",
  "is"
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-zа-яё0-9\s]/giu, " ")
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 2 && !stopWords.has(t));
}

function termFrequency(tokens: string[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const token of tokens) {
    map.set(token, (map.get(token) ?? 0) + 1);
  }
  return map;
}

function cosineSimilarity(a: Map<string, number>, b: Map<string, number>): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (const [token, value] of a) {
    normA += value * value;
    if (b.has(token)) {
      dot += value * (b.get(token) ?? 0);
    }
  }
  for (const value of b.values()) {
    normB += value * value;
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export interface RetrievalResult {
  answer: string;
  citations: { articleId: string; title: string }[];
  matches: { article: KnowledgeArticle; score: number }[];
}

export function retrieve(
  query: string,
  knowledge: KnowledgeArticle[],
  topK = 3
): RetrievalResult {
  const tokens = tokenize(query);
  if (tokens.length === 0) {
    return {
      answer:
        "Уточните, пожалуйста, ваш вопрос — я не смог распознать ключевые слова.",
      citations: [],
      matches: []
    };
  }

  const queryVec = termFrequency(tokens);
  const matches = knowledge
    .map((article) => {
      const corpus = `${article.title} ${article.excerpt} ${article.content} ${article.tags.join(" ")}`;
      const articleVec = termFrequency(tokenize(corpus));
      const score = cosineSimilarity(queryVec, articleVec);
      return { article, score };
    })
    .sort((a, b) => b.score - a.score)
    .filter((m) => m.score > 0)
    .slice(0, topK);

  if (matches.length === 0) {
    return {
      answer:
        "В базе знаний пока нет ответа на этот вопрос. Я создам обращение HR-куратору, чтобы вам ответили в течение рабочего дня.",
      citations: [],
      matches: []
    };
  }

  const best = matches[0].article;
  const supporting = matches.slice(1).map((m) => m.article);
  const supportText = supporting.length
    ? `\n\nДополнительно рекомендую посмотреть: ${supporting.map((s) => `«${s.title}»`).join(", ")}.`
    : "";

  const answer = `На основе документа «${best.title}» из раздела «${best.category}»:\n\n${best.excerpt}${supportText}\n\nЕсли нужно больше деталей — откройте полную статью в базе знаний.`;

  return {
    answer,
    citations: matches.map((m) => ({ articleId: m.article.id, title: m.article.title })),
    matches
  };
}

export function summarizeConversation(messages: ChatMessage[]): string {
  const user = messages.filter((m) => m.role === "user").slice(-1)[0];
  return user?.content.slice(0, 80) ?? "Новый запрос";
}
