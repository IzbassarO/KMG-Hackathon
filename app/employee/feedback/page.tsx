"use client";

import { useState } from "react";
import {
  HeartHandshake,
  Lightbulb,
  MessageCircle,
  Send,
  Smile,
  Sparkles,
  ThumbsDown,
  ThumbsUp
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const moods = [
  { value: "great", label: "Супер", color: "bg-emerald-500", Icon: Smile },
  { value: "good", label: "Хорошо", color: "bg-sky-500", Icon: ThumbsUp },
  { value: "meh", label: "Так себе", color: "bg-amber-500", Icon: MessageCircle },
  { value: "bad", label: "Сложно", color: "bg-red-500", Icon: ThumbsDown }
];

const pulseQuestions = [
  {
    id: "q1",
    title: "Насколько чёткий план первой недели?",
    options: ["Очень понятный", "В целом понятный", "Местами неясно", "Совсем нет"]
  },
  {
    id: "q2",
    title: "Достаточно ли поддержки от наставника?",
    options: ["Более чем", "В целом да", "Хотелось бы больше", "Связь редкая"]
  },
  {
    id: "q3",
    title: "Что улучшить в онбординге?",
    options: ["Документы", "Доступы", "Обучение", "Коммуникация"]
  }
];

export default function EmployeeFeedbackPage() {
  const { helpers, currentUser } = useStore();
  const [mood, setMood] = useState("good");
  const [comment, setComment] = useState("");
  const [pulseAnswers, setPulseAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  function submit() {
    helpers.logActivity({
      actorId: currentUser?.id ?? "anonymous",
      actorName: currentUser?.fullName ?? "Аноним",
      message: `Оставил фидбэк настроения «${mood}»`,
      type: "system"
    });
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
    setComment("");
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-semibold tracking-tight text-kmg-ink">
          <HeartHandshake className="h-7 w-7 text-kmg-gold" /> Фидбэк и пульс
        </h1>
        <p className="text-sm text-muted-foreground">
          Поделитесь, как проходит ваша адаптация. Ответы анонимны и помогают HR улучшить процесс.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Как ваше настроение сегодня?</CardTitle>
          <CardDescription>
            Это короткий пульс — занимает меньше минуты.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {moods.map((m) => {
              const Icon = m.Icon;
              const active = mood === m.value;
              return (
                <button
                  key={m.value}
                  onClick={() => setMood(m.value)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-2 rounded-2xl border p-4 transition-all",
                    active
                      ? "border-kmg-navy bg-kmg-navy/5 ring-2 ring-kmg-navy/20"
                      : "border-kmg-mist hover:border-kmg-navy/40"
                  )}
                >
                  <div className={`grid h-10 w-10 place-items-center rounded-xl ${m.color} text-white`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="text-sm font-semibold text-kmg-ink">{m.label}</div>
                </button>
              );
            })}
          </div>
          <div className="grid gap-2">
            <Label>Что хотели бы сказать команде HR?</Label>
            <Textarea
              rows={3}
              placeholder="Поделитесь, что работает, а что хочется улучшить"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Badge variant="secondary">
              <Sparkles className="h-3 w-3" /> Ответы видит только HR
            </Badge>
            <Button variant="accent" onClick={submit}>
              <Send className="h-4 w-4" /> Отправить пульс
            </Button>
          </div>
          {submitted && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              Спасибо! Ваш фидбэк отправлен HR-команде.
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Опрос «Первые впечатления»</CardTitle>
          <CardDescription>
            3 коротких вопроса. Каждый ответ помогает улучшить программу.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {pulseQuestions.map((q, idx) => (
            <div key={q.id} className="rounded-2xl border border-kmg-mist p-4">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">
                Вопрос {idx + 1}
              </div>
              <div className="mt-1 text-sm font-semibold text-kmg-ink">{q.title}</div>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {q.options.map((opt) => {
                  const active = pulseAnswers[q.id] === opt;
                  return (
                    <button
                      key={opt}
                      onClick={() => setPulseAnswers((p) => ({ ...p, [q.id]: opt }))}
                      className={cn(
                        "rounded-xl border px-3 py-2 text-left text-sm transition-all",
                        active
                          ? "border-kmg-navy bg-kmg-navy/5 ring-2 ring-kmg-navy/15"
                          : "border-kmg-mist hover:border-kmg-navy/40"
                      )}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-kmg-gold" /> Идеи и предложения
          </CardTitle>
          <CardDescription>
            Заметили, что можно сделать удобнее? Расскажите — лучшие идеи получат внедрение.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea rows={3} placeholder="Опишите идею или проблему" />
          <Button variant="outline" className="w-full">
            <Lightbulb className="h-4 w-4" /> Отправить идею
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
