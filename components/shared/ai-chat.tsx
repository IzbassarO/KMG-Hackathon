"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Loader2, Send, Sparkles, BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/lib/store";
import { cn, formatDateTime } from "@/lib/utils";
import type { ChatSession } from "@/lib/types";

const suggestions = [
  "Как оформить доступ к SAP?",
  "Что входит в welcome-pack?",
  "Какие документы нужны в первый день?",
  "Как работает программа менторства?"
];

export function AiChat({ context }: { context: "hr" | "employee" }) {
  const { state, currentUser, helpers } = useStore();
  const [chatId, setChatId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const chat: ChatSession | undefined = chatId
    ? state.chats.find((c) => c.id === chatId)
    : state.chats.find((c) => c.userId === currentUser?.id);

  useEffect(() => {
    if (chat) setChatId(chat.id);
  }, [chat]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [chat?.messages.length]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!input.trim() || pending) return;
    setPending(true);
    try {
      const result = await helpers.askAssistant(chatId, input);
      setChatId(result.id);
      setInput("");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className="flex h-[calc(100vh-12rem)] flex-col overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-kmg-mist bg-gradient-to-r from-kmg-navy to-kmg-navy-light px-5 py-3 text-white">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-kmg-gold text-white">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-semibold">KMG AI-Куратор</div>
            <div className="text-xs text-white/70">
              {context === "hr"
                ? "Помогает планировать и валидировать процессы онбординга"
                : "Отвечает на вопросы по адаптации, политикам и инструментам"}
            </div>
          </div>
        </div>
        <Badge variant="gold">RAG · {state.knowledge.length} статей</Badge>
      </div>
      <div
        ref={scrollRef}
        className="flex-1 space-y-4 overflow-y-auto bg-kmg-paper px-5 py-5 scrollbar-thin"
      >
        {(!chat || chat.messages.length === 0) && (
          <div className="rounded-2xl border border-dashed border-kmg-mist bg-white p-6">
            <div className="text-sm font-semibold text-kmg-ink">
              Привет, {currentUser?.fullName.split(" ")[0]}!
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              Спросите что-нибудь про онбординг — я найду ответ в корпоративной базе знаний и
              сошлюсь на источник.
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setInput(s)}
                  className="rounded-xl border border-kmg-mist bg-white px-3 py-2 text-left text-sm transition-colors hover:border-kmg-navy/40 hover:bg-kmg-mist/40"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {chat?.messages.map((message) => {
          const isUser = message.role === "user";
          return (
            <div
              key={message.id}
              className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-card",
                  isUser
                    ? "rounded-br-md bg-kmg-navy text-white"
                    : "rounded-bl-md bg-white text-kmg-ink"
                )}
              >
                <div className="whitespace-pre-wrap leading-relaxed">{message.content}</div>
                {message.citations && message.citations.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {message.citations.map((c) => (
                      <span
                        key={c.articleId}
                        className="inline-flex items-center gap-1 rounded-full bg-kmg-gold/15 px-2 py-0.5 text-[11px] font-semibold text-kmg-gold-dark"
                      >
                        <BookOpen className="h-3 w-3" /> {c.title}
                      </span>
                    ))}
                  </div>
                )}
                <div
                  className={cn(
                    "mt-2 text-[10px] uppercase tracking-widest",
                    isUser ? "text-white/60" : "text-muted-foreground"
                  )}
                >
                  {formatDateTime(message.createdAt)}
                </div>
              </div>
            </div>
          );
        })}
        {pending && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Ищу в базе знаний...
          </div>
        )}
      </div>
      <form
        onSubmit={handleSubmit}
        className="flex items-end gap-2 border-t border-kmg-mist bg-white p-4"
      >
        <Textarea
          placeholder="Спросите про онбординг..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e as unknown as FormEvent);
            }
          }}
          rows={2}
          className="flex-1 resize-none"
        />
        <Button type="submit" variant="accent" disabled={pending || !input.trim()}>
          <Send className="h-4 w-4" />
          Отправить
        </Button>
      </form>
    </Card>
  );
}
