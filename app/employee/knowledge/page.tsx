"use client";

import { useState } from "react";
import { BookOpen, Search } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useStore } from "@/lib/store";
import { formatDate } from "@/lib/utils";

export default function EmployeeKnowledgePage() {
  const { state } = useStore();
  const [search, setSearch] = useState("");
  const filtered = search
    ? state.knowledge.filter(
        (a) =>
          a.title.toLowerCase().includes(search.toLowerCase()) ||
          a.excerpt.toLowerCase().includes(search.toLowerCase()) ||
          a.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
      )
    : state.knowledge;
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-semibold tracking-tight text-kmg-ink">
            <BookOpen className="h-7 w-7 text-kmg-navy" /> База знаний
          </h1>
          <p className="text-sm text-muted-foreground">
            Тот же источник, который использует AI-ассистент.
          </p>
        </div>
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Поиск"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((article) => (
          <Card key={article.id}>
            <CardHeader>
              <div className="flex items-center justify-between text-xs uppercase tracking-widest text-muted-foreground">
                <span>{article.category}</span>
                <span>{formatDate(article.updatedAt)}</span>
              </div>
              <CardTitle className="text-base leading-snug">{article.title}</CardTitle>
              <CardDescription>{article.excerpt}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-1">
              {article.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  #{tag}
                </Badge>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
