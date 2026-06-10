"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { BookOpen, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { BuddyAvatar } from "./buddy-avatar";

const suggestions = [
  "Где посмотреть мои задачи?",
  "Как оформить доступ к SAP?",
  "Что входит в welcome-pack?",
  "Как работает менторство 30/60/90?"
];

/**
 * Чат Digital Buddy — стандартная модалка с вопросами. Ответы берутся из базы знаний
 * через helpers.askAssistant (lib/rag.ts → позже RAG-модуль коллеги).
 */
export function BuddyChat() {
  const { state, currentUser, helpers } = useStore();
  const [chatId, setChatId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const chat = chatId
    ? state.chats.find((c) => c.id === chatId)
    : state.chats.find((c) => c.userId === currentUser?.id);

  useEffect(() => {
    if (chat) setChatId(chat.id);
  }, [chat]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [chat?.messages.length, pending]);

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
    <div className="flex h-[58vh] flex-col bg-kmg-paper">
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4 scrollbar-thin">
        {(!chat || chat.messages.length === 0) && (
          <div className="rounded-2xl border border-dashed border-kmg-mist bg-white p-4">
            <div className="text-sm font-semibold text-kmg-ink">
              Спросите меня о чём угодно по онбордингу
            </div>
            <div className="mt-0.5 text-sm text-muted-foreground">
              Я найду ответ в корпоративной базе знаний и покажу источник.
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
            <div key={message.id} className={cn("flex w-full gap-2", isUser ? "justify-end" : "justify-start")}>
              {!isUser && <BuddyAvatar size={28} className="mt-1 shrink-0" />}
              <div
                className={cn(
                  "max-w-[78%] rounded-2xl px-3 py-2 text-sm shadow-card",
                  isUser ? "rounded-br-md bg-kmg-navy text-white" : "rounded-bl-md bg-white text-kmg-ink"
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
      <form onSubmit={handleSubmit} className="flex items-end gap-2 border-t border-kmg-mist bg-white p-3">
        <Textarea
          placeholder="Спросите Digital Buddy..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e as unknown as FormEvent);
            }
          }}
          rows={1}
          className="flex-1 resize-none"
        />
        <Button type="submit" variant="accent" disabled={pending || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
