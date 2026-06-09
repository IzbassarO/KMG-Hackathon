"use client";

import { useState } from "react";
import {
  ChevronDown,
  HelpCircle,
  Mail,
  MessageSquareText,
  Phone,
  Search,
  Sparkles
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface FaqItem {
  category: string;
  question: string;
  answer: string;
}

const faqs: FaqItem[] = [
  {
    category: "Первый день",
    question: "Куда обратиться в первый рабочий день?",
    answer:
      "Подойдите к HR-куратору на 3-м этаже офиса KMG (ул. Кабанбай батыра, 19). Если приехали удалённо — напишите в чат AI-ассистента, он подскажет точку входа."
  },
  {
    category: "Документы",
    question: "В каком формате загружать сканы документов?",
    answer:
      "PDF или JPG, разрешение не ниже 200 dpi. Размер каждого файла — до 10 МБ. Можно загружать через раздел «Документы» или прикреплять прямо в чат с HR."
  },
  {
    category: "ИТ",
    question: "Что делать, если не работает VPN?",
    answer:
      "Откройте Cisco AnyConnect, попробуйте переподключиться. Если не помогло — создайте заявку в ServiceDesk (sd.kmg.kz) или напишите в чат AI-ассистента — он подскажет инструкцию."
  },
  {
    category: "Обучение",
    question: "Обязательно ли проходить все курсы?",
    answer:
      "Курсы по HSE и антикоррупционной политике — обязательны для всех. Остальные зависят от роли. Куратор отметит обязательный список в плане 30/60/90."
  },
  {
    category: "AI-ассистент",
    question: "Какие данные можно загружать в чат?",
    answer:
      "Внутренние политики, инструкции, обучающие материалы. Запрещено: персональные данные клиентов, коммерческие тайны, исходные коды критических систем. См. политику в разделе «База знаний»."
  },
  {
    category: "Менторство",
    question: "Что делать, если наставник недоступен?",
    answer:
      "Если ментор не отвечает более 24 часов, обратитесь к HR-куратору через раздел «Команда» или AI-ассистенту — он перенаправит запрос."
  }
];

const categories = Array.from(new Set(faqs.map((f) => f.category)));

export default function EmployeeHelpPage() {
  const [search, setSearch] = useState("");
  const [active, setActive] = useState<string | null>(null);
  const [category, setCategory] = useState<string | "all">("all");

  const filtered = faqs.filter((f) => {
    const matchesQ =
      !search ||
      f.question.toLowerCase().includes(search.toLowerCase()) ||
      f.answer.toLowerCase().includes(search.toLowerCase());
    const matchesC = category === "all" || f.category === category;
    return matchesQ && matchesC;
  });

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-semibold tracking-tight text-kmg-ink">
          <HelpCircle className="h-7 w-7 text-kmg-navy" /> Помощь и FAQ
        </h1>
        <p className="text-sm text-muted-foreground">
          Часто задаваемые вопросы и контакты поддержки KMG.
        </p>
      </div>

      <Card>
        <CardContent className="grid gap-3 p-5 md:grid-cols-3">
          <ContactCard
            icon={Sparkles}
            tone="gold"
            title="AI-Ассистент"
            description="Мгновенный ответ из базы знаний с цитатами"
            cta="Открыть чат"
            href="/employee/assistant"
          />
          <ContactCard
            icon={Phone}
            tone="navy"
            title="HR-куратор"
            description="+7 (7172) 78 96 01 · с 9:00 до 18:00"
            cta="Позвонить"
            href="tel:+77172789601"
          />
          <ContactCard
            icon={Mail}
            tone="info"
            title="Email поддержки"
            description="onboarding@kmg.kz · ответ за 4 часа"
            cta="Написать"
            href="mailto:onboarding@kmg.kz"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Частые вопросы</CardTitle>
          <CardDescription>
            Если ответа нет здесь — спросите AI-ассистента, он найдёт его в базе знаний.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Поиск по вопросам"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCategory("all")}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-semibold transition",
                category === "all"
                  ? "border-kmg-navy bg-kmg-navy text-white"
                  : "border-kmg-mist bg-white text-kmg-ink hover:border-kmg-navy/40"
              )}
            >
              Все
            </button>
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-semibold transition",
                  category === c
                    ? "border-kmg-navy bg-kmg-navy text-white"
                    : "border-kmg-mist bg-white text-kmg-ink hover:border-kmg-navy/40"
                )}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="divide-y divide-kmg-mist rounded-2xl border border-kmg-mist">
            {filtered.map((item) => {
              const open = active === item.question;
              return (
                <button
                  key={item.question}
                  onClick={() => setActive(open ? null : item.question)}
                  className="block w-full text-left"
                >
                  <div className="flex items-start justify-between gap-3 p-4">
                    <div>
                      <Badge variant="secondary" className="mb-1">
                        {item.category}
                      </Badge>
                      <div className="text-sm font-semibold text-kmg-ink">
                        {item.question}
                      </div>
                      {open && (
                        <div className="mt-2 text-sm leading-relaxed text-muted-foreground">
                          {item.answer}
                        </div>
                      )}
                    </div>
                    <ChevronDown
                      className={cn(
                        "mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                        open && "rotate-180"
                      )}
                    />
                  </div>
                </button>
              );
            })}
            {filtered.length === 0 && (
              <div className="p-6 text-center text-sm text-muted-foreground">
                По вашему запросу ничего не найдено. Попробуйте спросить AI-ассистента.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-kmg-gold text-white">
              <MessageSquareText className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-kmg-ink">
                Не нашли ответ?
              </div>
              <div className="text-xs text-muted-foreground">
                Создайте обращение HR-куратору, мы ответим в течение рабочего дня.
              </div>
            </div>
          </div>
          <Button variant="accent">Создать обращение</Button>
        </CardContent>
      </Card>
    </div>
  );
}

function ContactCard({
  icon: Icon,
  title,
  description,
  cta,
  href,
  tone
}: {
  icon: typeof Sparkles;
  title: string;
  description: string;
  cta: string;
  href: string;
  tone: "navy" | "gold" | "info";
}) {
  const palette: Record<typeof tone, string> = {
    navy: "from-kmg-navy to-kmg-navy-light",
    gold: "from-kmg-gold to-kmg-gold-light",
    info: "from-sky-500 to-sky-400"
  };
  return (
    <a
      href={href}
      className="flex flex-col gap-3 rounded-2xl border border-kmg-mist p-4 transition-colors hover:border-kmg-navy/40"
    >
      <div
        className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${palette[tone]} text-white`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="text-sm font-semibold text-kmg-ink">{title}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
      <span className="text-xs font-semibold text-kmg-navy">{cta} →</span>
    </a>
  );
}
