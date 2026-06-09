"use client";

import { useMemo, useState } from "react";
import { BookOpen, Database, Filter, Plus, Search, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStore } from "@/lib/store";
import { formatDate } from "@/lib/utils";

export default function HrKnowledgePage() {
  const { state } = useStore();
  const [search, setSearch] = useState("");
  const categories = useMemo(
    () => Array.from(new Set(state.knowledge.map((a) => a.category))),
    [state.knowledge]
  );

  const filtered = useMemo(() => {
    if (!search) return state.knowledge;
    const q = search.toLowerCase();
    return state.knowledge.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.excerpt.toLowerCase().includes(q) ||
        a.tags.some((t) => t.toLowerCase().includes(q))
    );
  }, [state.knowledge, search]);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-kmg-ink">База знаний</h1>
          <p className="text-sm text-muted-foreground">
            Источник истины для RAG-ассистента. Каждая статья индексируется и цитируется.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Database className="h-4 w-4" /> Реиндексировать
          </Button>
          <Button variant="accent">
            <Plus className="h-4 w-4" /> Добавить статью
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 p-4">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Поиск по статьям"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {categories.map((cat) => (
              <Badge key={cat} variant="outline">
                {cat}
              </Badge>
            ))}
          </div>
          <Button variant="ghost" className="ml-auto">
            <Filter className="h-4 w-4" /> Фильтры
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((article) => (
          <Card key={article.id} className="flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between text-xs uppercase tracking-widest text-muted-foreground">
                <span>{article.category}</span>
                <span>{formatDate(article.updatedAt)}</span>
              </div>
              <CardTitle className="text-base leading-snug">{article.title}</CardTitle>
              <CardDescription className="line-clamp-3">{article.excerpt}</CardDescription>
            </CardHeader>
            <CardContent className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-0">
              <div className="flex flex-wrap gap-1">
                {article.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    #{tag}
                  </Badge>
                ))}
              </div>
              <Button variant="ghost" size="sm">
                <BookOpen className="h-4 w-4" /> Открыть
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-kmg-gold" /> Готовность к RAG
          </CardTitle>
          <CardDescription>
            Что необходимо подключить для перехода на боевые эмбеддинги Anthropic Claude в защищённом
            контуре KMG.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {[
            {
              title: "Embeddings",
              text: "Anthropic Claude embeddings или KMG-NLP заменят локальный TF-IDF.",
              status: "Бета"
            },
            {
              title: "Vector DB",
              text: "pgvector / Qdrant в облаке KMG для быстрых выборок ≥10k документов.",
              status: "Готово к подключению"
            },
            {
              title: "Auth & PII",
              text: "AD-интеграция + PII-фильтры для исключения чувствительных данных.",
              status: "В разработке"
            }
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-kmg-mist bg-kmg-paper p-4"
            >
              <div className="text-xs uppercase tracking-widest text-muted-foreground">
                {item.status}
              </div>
              <div className="mt-1 text-base font-semibold text-kmg-ink">{item.title}</div>
              <div className="mt-1 text-sm text-muted-foreground">{item.text}</div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
