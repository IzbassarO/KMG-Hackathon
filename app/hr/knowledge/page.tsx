"use client";

import { useMemo, useRef, useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  Database,
  Filter,
  Loader2,
  Search,
  Sparkles,
  Trash2,
  UploadCloud
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStore } from "@/lib/store";
import { formatDate, formatDateTime } from "@/lib/utils";

export default function HrKnowledgePage() {
  const { state, currentUser, helpers } = useStore();
  const [search, setSearch] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const docs = helpers.vectorDocs();

  function handleFiles(files: FileList | null) {
    if (!files || !currentUser) return;
    Array.from(files).forEach((file) => {
      const sizeLabel = `${(file.size / 1024 / 1024).toFixed(1)} МБ`;
      const id = helpers.addVectorDoc(file.name, sizeLabel, currentUser.fullName);
      // Симуляция индексации: через ~1.6с помечаем «в базе».
      setTimeout(() => helpers.markVectorDocIndexed(id), 1600);
    });
  }
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
      </div>

      {/* Загрузка документов в векторную базу (симуляция) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-4 w-4 text-kmg-navy" /> Документы для AI (векторная база)
          </CardTitle>
          <CardDescription>
            Загрузите ВНД и регламенты (PDF) — они «индексируются» в векторную базу для RAG-ассистента.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handleFiles(e.dataTransfer.files);
            }}
            className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-kmg-navy/30 bg-kmg-navy/5 p-8 text-center transition-colors hover:border-kmg-navy"
          >
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-kmg-navy text-white shadow-elevated">
              <UploadCloud className="h-6 w-6" />
            </div>
            <div className="text-sm font-semibold text-kmg-ink">
              Перетащите PDF или нажмите для выбора
            </div>
            <div className="text-xs text-muted-foreground">PDF · можно несколько файлов</div>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf"
              multiple
              hidden
              onChange={(e) => handleFiles(e.target.files)}
            />
          </button>

          {docs.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">
                Загруженные документы · {docs.length}
              </div>
              {docs.map((doc) => (
                <div
                  key={doc.id}
                  className="flex flex-wrap items-center gap-3 rounded-xl border border-kmg-mist p-3"
                >
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-kmg-mist text-kmg-navy">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-kmg-ink">{doc.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {doc.sizeLabel} · {doc.uploadedBy} · {formatDateTime(doc.uploadedAt)}
                    </div>
                  </div>
                  {doc.status === "indexing" ? (
                    <Badge variant="warning">
                      <Loader2 className="h-3 w-3 animate-spin" /> Индексация…
                    </Badge>
                  ) : (
                    <Badge variant="success">
                      <CheckCircle2 className="h-3 w-3" /> В базе
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Удалить"
                    onClick={() => helpers.removeVectorDoc(doc.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
