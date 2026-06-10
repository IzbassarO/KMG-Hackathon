"use client";

import { useState } from "react";
import { HeartHandshake, Lightbulb, MessageCircle, Send, Smile, ThumbsDown, ThumbsUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useStore } from "@/lib/store";
import { usePreferences } from "@/components/providers/preferences";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n";

const MOODS = [
  { value: "great", key: "feedback.moodGreat", color: "bg-emerald-500", Icon: Smile },
  { value: "good", key: "feedback.moodGood", color: "bg-sky-500", Icon: ThumbsUp },
  { value: "meh", key: "feedback.moodMeh", color: "bg-amber-500", Icon: MessageCircle },
  { value: "bad", key: "feedback.moodBad", color: "bg-red-500", Icon: ThumbsDown }
];

const PULSE: Record<Locale, { id: string; title: string; options: string[] }[]> = {
  ru: [
    { id: "q1", title: "Насколько чёткий план первой недели?", options: ["Очень понятный", "В целом понятный", "Местами неясно", "Совсем нет"] },
    { id: "q2", title: "Достаточно ли поддержки от наставника?", options: ["Более чем", "В целом да", "Хотелось бы больше", "Связь редкая"] },
    { id: "q3", title: "Что улучшить в онбординге?", options: ["Документы", "Доступы", "Обучение", "Коммуникация"] }
  ],
  kk: [
    { id: "q1", title: "Бірінші апта жоспары қаншалықты түсінікті?", options: ["Өте түсінікті", "Жалпы түсінікті", "Кей жерде түсініксіз", "Мүлдем жоқ"] },
    { id: "q2", title: "Тәлімгер қолдауы жеткілікті ме?", options: ["Жеткілікті", "Жалпы иә", "Көбірек қалаймын", "Байланыс сирек"] },
    { id: "q3", title: "Онбордингте нені жақсарту керек?", options: ["Құжаттар", "Қолжетімділік", "Оқу", "Коммуникация"] }
  ],
  en: [
    { id: "q1", title: "How clear was your first-week plan?", options: ["Very clear", "Mostly clear", "Sometimes unclear", "Not at all"] },
    { id: "q2", title: "Enough support from your mentor?", options: ["More than enough", "Mostly yes", "Would like more", "Rarely in touch"] },
    { id: "q3", title: "What to improve in onboarding?", options: ["Documents", "Access", "Learning", "Communication"] }
  ]
};

export default function EmployeeFeedbackPage() {
  const { helpers, currentUser } = useStore();
  const { locale, t } = usePreferences();
  const [mood, setMood] = useState("good");
  const [comment, setComment] = useState("");
  const [pulseAnswers, setPulseAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [idea, setIdea] = useState("");
  const [ideaSent, setIdeaSent] = useState(false);

  const questions = PULSE[locale];

  function submit() {
    if (!currentUser) return;
    helpers.submitFeedback(currentUser.id, {
      kind: "pulse",
      mood,
      comment: comment.trim() || undefined,
      pulse: pulseAnswers
    });
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
    setComment("");
    setPulseAnswers({});
  }

  function sendIdea() {
    if (!currentUser || !idea.trim()) return;
    helpers.submitFeedback(currentUser.id, { kind: "idea", comment: idea.trim() });
    setIdea("");
    setIdeaSent(true);
    setTimeout(() => setIdeaSent(false), 4000);
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-semibold tracking-tight text-kmg-ink">
          <HeartHandshake className="h-7 w-7 text-kmg-gold" /> {t("feedback.title")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("feedback.subtitle")}</p>
      </div>

      {/* Единая форма пульса с одной кнопкой отправки */}
      <Card>
        <CardHeader>
          <CardTitle>{t("feedback.pulseTitle")}</CardTitle>
          <CardDescription>{t("feedback.pulseDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="mb-2 block">{t("feedback.mood")}</Label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {MOODS.map((m) => {
                const Icon = m.Icon;
                const active = mood === m.value;
                return (
                  <button
                    key={m.value}
                    onClick={() => setMood(m.value)}
                    className={cn(
                      "flex flex-col items-center justify-center gap-2 rounded-2xl border p-3 transition-all",
                      active
                        ? "border-kmg-navy bg-kmg-navy/5 ring-2 ring-kmg-navy/20"
                        : "border-kmg-mist hover:border-kmg-navy/40"
                    )}
                  >
                    <div className={`grid h-9 w-9 place-items-center rounded-xl ${m.color} text-white`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="text-sm font-semibold text-kmg-ink">{t(m.key)}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {questions.map((q, idx) => (
            <div key={q.id}>
              <Label className="mb-2 block">
                {idx + 1}. {q.title}
              </Label>
              <div className="grid gap-2 sm:grid-cols-2">
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

          <div className="grid gap-2">
            <Label>{t("feedback.comment")}</Label>
            <Textarea
              rows={3}
              placeholder={t("feedback.commentPlaceholder")}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-kmg-mist pt-4">
            <Badge variant="secondary">{t("feedback.onlyHr")}</Badge>
            <Button variant="accent" size="lg" onClick={submit}>
              <Send className="h-4 w-4" /> {t("feedback.submit")}
            </Button>
          </div>
          {submitted && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {t("feedback.submitted")}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-kmg-gold" /> {t("feedback.ideaTitle")}
          </CardTitle>
          <CardDescription>{t("feedback.ideaDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            rows={3}
            placeholder={t("feedback.ideaPlaceholder")}
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
          />
          <Button variant="outline" className="w-full" onClick={sendIdea} disabled={!idea.trim()}>
            <Lightbulb className="h-4 w-4" /> {t("feedback.ideaSubmit")}
          </Button>
          {ideaSent && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {t("feedback.ideaSent")}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
