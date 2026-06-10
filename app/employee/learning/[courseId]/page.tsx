"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Check,
  CheckCircle2,
  Circle,
  FileText,
  HelpCircle,
  PlayCircle,
  RotateCcw,
  X
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { courseSections, getCourse, type CourseSection } from "@/lib/courses";
import { youtubeEmbed } from "@/lib/media";

const KIND_ICON = { text: FileText, video: PlayCircle, quiz: HelpCircle };

export default function CoursePlayerPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = use(params);
  const course = getCourse(courseId);
  const { state, currentUser, helpers } = useStore();
  const sections = useMemo(() => (course ? courseSections(course) : []), [course]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (!course || !currentUser || activeId) return;
    const firstIncomplete = sections.find(
      (s) => !helpers.isSectionDone(currentUser.id, course.id, s.id)
    );
    setActiveId(firstIncomplete?.id ?? sections[0]?.id ?? null);
  }, [course, currentUser, activeId, sections, helpers]);

  if (!course) {
    if (state.hydrated) notFound();
    return null;
  }
  if (!currentUser) return null;

  const uid = currentUser.id;
  const active = sections.find((s) => s.id === activeId) ?? sections[0];
  const activeIndex = sections.findIndex((s) => s.id === active?.id);
  const pct = helpers.courseProgressPct(uid, course.id);
  const complete = helpers.isCourseComplete(uid, course.id);

  function goNext() {
    const next = sections[activeIndex + 1];
    if (next) setActiveId(next.id);
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/employee/learning">
            <ArrowLeft className="h-4 w-4" /> К курсам
          </Link>
        </Button>
        {complete && (
          <Badge variant="success">
            <Award className="h-3.5 w-3.5" /> Курс завершён
          </Badge>
        )}
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold text-kmg-ink">{course.title}</h1>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{course.description}</p>
            </div>
            <Badge variant="navy">{course.category}</Badge>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <Progress value={pct} className="flex-1" />
            <span className="w-12 text-right text-sm font-semibold text-kmg-navy">{pct}%</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
        {/* Sidebar: модули и разделы */}
        <Card className="h-fit">
          <CardContent className="space-y-4 p-4">
            {course.modules.map((m, mi) => (
              <div key={m.id}>
                <div className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Модуль {mi + 1}: {m.title}
                </div>
                <div className="space-y-1">
                  {m.sections.map((s) => {
                    const done = helpers.isSectionDone(uid, course.id, s.id);
                    const Icon = KIND_ICON[s.kind];
                    const isActive = s.id === active?.id;
                    return (
                      <button
                        key={s.id}
                        onClick={() => setActiveId(s.id)}
                        className={cn(
                          "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors",
                          isActive ? "bg-kmg-navy text-white" : "hover:bg-kmg-mist/50 text-kmg-ink"
                        )}
                      >
                        {done ? (
                          <CheckCircle2
                            className={cn("h-4 w-4 shrink-0", isActive ? "text-white" : "text-emerald-500")}
                          />
                        ) : (
                          <Circle className={cn("h-4 w-4 shrink-0", isActive ? "text-white/70" : "text-kmg-mist")} />
                        )}
                        <Icon className={cn("h-3.5 w-3.5 shrink-0", isActive ? "text-white/80" : "text-kmg-navy")} />
                        <span className="flex-1 truncate">{s.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Контент активного раздела */}
        <Card>
          <CardContent className="p-6">
            {active && (
              <SectionContent
                key={active.id}
                section={active}
                done={helpers.isSectionDone(uid, course.id, active.id)}
                quiz={helpers.quizResult(uid, course.id, active.id)}
                hasNext={activeIndex < sections.length - 1}
                onMarkDone={() => {
                  helpers.markSectionDone(uid, course.id, active.id);
                  goNext();
                }}
                onSubmitQuiz={(score, total) => helpers.submitQuiz(uid, course.id, active.id, score, total)}
                onNext={goNext}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SectionContent({
  section,
  done,
  quiz,
  hasNext,
  onMarkDone,
  onSubmitQuiz,
  onNext
}: {
  section: CourseSection;
  done: boolean;
  quiz?: { score: number; total: number; passed: boolean };
  hasNext: boolean;
  onMarkDone: () => void;
  onSubmitQuiz: (score: number, total: number) => void;
  onNext: () => void;
}) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const title = (
    <h2 className="text-xl font-semibold text-kmg-ink">{section.title}</h2>
  );

  if (section.kind === "text") {
    return (
      <div className="space-y-4">
        {title}
        <div className="space-y-3 text-sm leading-relaxed text-kmg-ink/90">
          {(section.body ?? "").split("\n\n").map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
        <ContinueBar done={done} hasNext={hasNext} onMarkDone={onMarkDone} onNext={onNext} label="Отметить прочитанным" />
      </div>
    );
  }

  if (section.kind === "video") {
    const embed = youtubeEmbed(section.videoUrl);
    return (
      <div className="space-y-4">
        {title}
        {embed ? (
          <div className="aspect-video w-full overflow-hidden rounded-2xl border border-kmg-mist">
            <iframe
              src={embed}
              title={section.title}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="grid aspect-video w-full place-items-center rounded-2xl border border-dashed border-kmg-mist bg-kmg-paper text-center text-sm text-muted-foreground">
            <div>
              <PlayCircle className="mx-auto mb-2 h-10 w-10 text-kmg-navy/40" />
              Видео скоро появится.
              <br />
              Ссылку добавляют в <code className="text-kmg-navy">lib/media.ts</code>.
            </div>
          </div>
        )}
        <ContinueBar done={done} hasNext={hasNext} onMarkDone={onMarkDone} onNext={onNext} label="Отметить просмотренным" />
      </div>
    );
  }

  // quiz
  const questions = section.questions ?? [];
  const allAnswered = questions.every((q) => answers[q.id] !== undefined);
  const score = questions.filter((q) => answers[q.id] === q.correct).length;
  const result = submitted ? { score, total: questions.length, passed: score >= questions.length } : quiz;

  function submit() {
    setSubmitted(true);
    onSubmitQuiz(score, questions.length);
  }
  function retry() {
    setAnswers({});
    setSubmitted(false);
  }

  return (
    <div className="space-y-4">
      {title}
      <p className="text-sm text-muted-foreground">
        Ответьте на вопросы. Для зачёта нужны все правильные ответы — можно пересдать.
      </p>
      <div className="space-y-4">
        {questions.map((q, qi) => (
          <div key={q.id} className="rounded-2xl border border-kmg-mist p-4">
            <div className="text-sm font-semibold text-kmg-ink">
              {qi + 1}. {q.question}
            </div>
            <div className="mt-2 space-y-1.5">
              {q.options.map((opt, oi) => {
                const chosen = answers[q.id] === oi;
                const showCorrect = (submitted || result) && oi === q.correct;
                const showWrong = (submitted || result) && chosen && oi !== q.correct;
                return (
                  <button
                    key={oi}
                    type="button"
                    disabled={Boolean(result?.passed)}
                    onClick={() => setAnswers((p) => ({ ...p, [q.id]: oi }))}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                      showCorrect
                        ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                        : showWrong
                          ? "border-red-300 bg-red-50 text-red-800"
                          : chosen
                            ? "border-kmg-navy bg-kmg-navy/5"
                            : "border-kmg-mist hover:border-kmg-navy/40"
                    )}
                  >
                    <span
                      className={cn(
                        "grid h-4 w-4 shrink-0 place-items-center rounded-full border",
                        chosen ? "border-kmg-navy" : "border-kmg-mist"
                      )}
                    >
                      {chosen && <span className="h-2 w-2 rounded-full bg-kmg-navy" />}
                    </span>
                    <span className="flex-1">{opt}</span>
                    {showCorrect && <Check className="h-4 w-4 text-emerald-600" />}
                    {showWrong && <X className="h-4 w-4 text-red-600" />}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {result ? (
        <div
          className={cn(
            "flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4",
            result.passed ? "border-emerald-200 bg-emerald-50/60" : "border-amber-200 bg-amber-50/60"
          )}
        >
          <div className="text-sm font-semibold text-kmg-ink">
            {result.passed ? "Тест пройден! 🎉" : "Не все ответы верны."} Результат: {result.score} из{" "}
            {result.total}
          </div>
          <div className="flex gap-2">
            {!result.passed && (
              <Button variant="outline" size="sm" onClick={retry}>
                <RotateCcw className="h-4 w-4" /> Пересдать
              </Button>
            )}
            {result.passed && hasNext && (
              <Button variant="accent" size="sm" onClick={onNext}>
                Далее <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      ) : (
        <Button variant="accent" disabled={!allAnswered} onClick={submit}>
          Проверить ответы
        </Button>
      )}
    </div>
  );
}

function ContinueBar({
  done,
  hasNext,
  onMarkDone,
  onNext,
  label
}: {
  done: boolean;
  hasNext: boolean;
  onMarkDone: () => void;
  onNext: () => void;
  label: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2 border-t border-kmg-mist pt-4">
      <span className="text-xs text-muted-foreground">
        {done ? "Раздел пройден" : "Изучите материал и отметьте раздел"}
      </span>
      {done ? (
        hasNext ? (
          <Button variant="outline" size="sm" onClick={onNext}>
            Далее <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Badge variant="success">
            <CheckCircle2 className="h-3.5 w-3.5" /> Завершено
          </Badge>
        )
      ) : (
        <Button variant="accent" size="sm" onClick={onMarkDone}>
          <Check className="h-4 w-4" /> {label}
        </Button>
      )}
    </div>
  );
}
