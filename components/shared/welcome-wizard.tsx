"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  CloudUpload,
  Compass,
  Sparkles,
  X
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/lib/store";

const STORAGE_KEY = "kmg.onboarding.welcome.dismissed";

const steps = [
  {
    title: "Добро пожаловать в KMG!",
    body: "Вы попали в портал онбординга. Здесь — все ваши задачи, документы, наставник и AI-ассистент.",
    icon: Sparkles,
    art: "gradient-navy"
  },
  {
    title: "Ваш путь — это flowchart",
    body: "Каждый этап адаптации — отдельный тикет с визуальным процессом. Откройте «Мой путь», чтобы увидеть карту.",
    icon: Compass,
    art: "gradient-gold"
  },
  {
    title: "Загрузите документы",
    body: "В разделе «Документы» вы найдёте чек-лист и удобную загрузку. Все файлы шифруются.",
    icon: CloudUpload,
    art: "gradient-navy"
  },
  {
    title: "Спрашивайте AI-ассистента",
    body: "AI отвечает на вопросы по базе знаний KMG и ссылается на источник. Никаких выдуманных ответов.",
    icon: BookOpen,
    art: "gradient-gold"
  }
];

export function WelcomeWizard() {
  const { currentUser } = useStore();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!currentUser || currentUser.role !== "employee") return;
    const key = `${STORAGE_KEY}/${currentUser.id}`;
    if (typeof window !== "undefined" && !window.localStorage.getItem(key)) {
      setOpen(true);
    }
  }, [currentUser]);

  function dismiss() {
    if (!currentUser) return;
    if (typeof window !== "undefined") {
      window.localStorage.setItem(`${STORAGE_KEY}/${currentUser.id}`, "1");
    }
    setOpen(false);
    setStep(0);
  }

  if (!currentUser) return null;
  const current = steps[step];
  const Icon = current.icon;

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : dismiss())}>
      <DialogContent className="overflow-hidden p-0 sm:max-w-xl">
        <div className={`relative ${current.art} p-8 text-white`}>
          <button
            onClick={dismiss}
            className="absolute right-4 top-4 rounded-md p-1 text-white/70 hover:text-white"
            aria-label="Закрыть"
          >
            <X className="h-4 w-4" />
          </button>
          <Badge variant="gold" className="mb-4">
            Шаг {step + 1} из {steps.length}
          </Badge>
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/15 backdrop-blur">
            <Icon className="h-7 w-7" />
          </div>
          <DialogHeader className="mt-4">
            <DialogTitle className="text-2xl text-white">
              {step === 0
                ? `${current.title} ${currentUser.fullName.split(" ")[0]}!`
                : current.title}
            </DialogTitle>
            <DialogDescription className="text-base text-white/80">
              {current.body}
            </DialogDescription>
          </DialogHeader>
        </div>
        <div className="bg-white p-6">
          <div className="grid gap-2 sm:grid-cols-4">
            {steps.map((s, idx) => (
              <button
                key={s.title}
                onClick={() => setStep(idx)}
                className={`rounded-xl border p-3 text-left text-xs transition-all ${
                  idx === step
                    ? "border-kmg-navy bg-kmg-navy/5"
                    : idx < step
                      ? "border-emerald-300 bg-emerald-50"
                      : "border-kmg-mist bg-white"
                }`}
              >
                <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
                  <span>Шаг {idx + 1}</span>
                  {idx < step && <CheckCircle2 className="h-3 w-3 text-emerald-600" />}
                </div>
                <div className="mt-1 text-sm font-semibold text-kmg-ink">{s.title}</div>
              </button>
            ))}
          </div>
          <DialogFooter className="mt-4 flex flex-row items-center justify-between gap-2 sm:justify-between">
            <Button variant="ghost" onClick={dismiss}>
              Пропустить
            </Button>
            <div className="flex gap-2">
              {step > 0 && (
                <Button variant="outline" onClick={() => setStep(step - 1)}>
                  Назад
                </Button>
              )}
              {step < steps.length - 1 ? (
                <Button variant="accent" onClick={() => setStep(step + 1)}>
                  Далее <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button variant="accent" asChild onClick={dismiss}>
                  <Link href="/employee/journey">
                    Открыть мой путь <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
