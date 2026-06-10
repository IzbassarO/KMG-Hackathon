"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { clamp, cn } from "@/lib/utils";
import { TUTORIAL_STEPS, type TutorialPlacement } from "@/lib/buddy";
import { BuddyCharacter } from "./buddy-character";

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PANEL_W = 340;
const PANEL_H = 250;
const PAD = 8;
const GAP = 18;

function computePanel(rect: Rect | null, placement: TutorialPlacement): { top: number; left: number } {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  if (!rect || placement === "center") {
    return { left: (vw - PANEL_W) / 2, top: (vh - PANEL_H) / 2 };
  }
  let left = rect.left;
  let top = rect.top;
  switch (placement) {
    case "right":
      left = rect.left + rect.width + GAP;
      top = rect.top - 8;
      break;
    case "left":
      left = rect.left - PANEL_W - GAP;
      top = rect.top - 8;
      break;
    case "bottom":
      top = rect.top + rect.height + GAP;
      left = rect.left + rect.width / 2 - PANEL_W / 2;
      break;
    case "top":
      top = rect.top - PANEL_H - GAP;
      left = rect.left + rect.width - PANEL_W;
      break;
  }
  return {
    left: clamp(left, GAP, vw - PANEL_W - GAP),
    top: clamp(top, GAP, vh - PANEL_H - GAP)
  };
}

export function BuddyTutorial({ onFinish }: { onFinish: () => void }) {
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [panel, setPanel] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  const step = TUTORIAL_STEPS[index];
  const isFirst = index === 0;
  const isLast = index === TUTORIAL_STEPS.length - 1;

  const measure = useCallback(() => {
    const current = TUTORIAL_STEPS[index];
    let nextRect: Rect | null = null;
    if (current.target) {
      const el = document.querySelector(current.target);
      if (el) {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) {
          nextRect = { top: r.top, left: r.left, width: r.width, height: r.height };
        }
      }
    }
    setRect(nextRect);
    setPanel(computePanel(nextRect, current.placement));
  }, [index]);

  useLayoutEffect(() => {
    measure();
    const id = window.setTimeout(measure, 60); // повторный замер после анимаций раскладки
    return () => window.clearTimeout(id);
  }, [measure]);

  useEffect(() => {
    const onChange = () => measure();
    window.addEventListener("resize", onChange);
    window.addEventListener("scroll", onChange, true);
    return () => {
      window.removeEventListener("resize", onChange);
      window.removeEventListener("scroll", onChange, true);
    };
  }, [measure]);

  // Блокируем прокрутку фона на время обучения
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // На целевых шагах — «дырка» вокруг элемента; на центральных — затемняем весь экран.
  const spotStyle = rect
    ? {
        top: rect.top - PAD,
        left: rect.left - PAD,
        width: rect.width + PAD * 2,
        height: rect.height + PAD * 2,
        boxShadow: "0 0 0 9999px rgba(11, 31, 58, 0.74)"
      }
    : {
        top: "50vh" as const,
        left: "50vw" as const,
        width: 0,
        height: 0,
        boxShadow: "0 0 0 9999px rgba(11, 31, 58, 0.74)"
      };

  return (
    <div className="fixed inset-0 z-[60]">
      {/* Прозрачный слой, блокирующий клики по порталу (hard-gate) */}
      <div className="absolute inset-0" />

      {/* Прожектор: затемнение всего экрана + «дырка» на цели (плавно перемещается) */}
      <div
        className={cn(
          "pointer-events-none absolute rounded-xl transition-all duration-300 ease-out",
          rect && "border-2 border-kmg-gold"
        )}
        style={spotStyle}
      />

      {/* Панель Digital Buddy (плавно перемещается от элемента к элементу) */}
      <div
        className="pointer-events-auto absolute w-[340px] animate-cloud-pop transition-all duration-300 ease-out"
        style={{ top: panel.top, left: panel.left }}
      >
        <div className="overflow-hidden rounded-2xl border border-kmg-mist bg-white shadow-elevated">
          <div className="flex items-start gap-3 p-4">
            <BuddyCharacter className="h-20 w-16 shrink-0" mood={step.mood ?? "happy"} float={false} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-kmg-ink">Digital Buddy</span>
                <span className="text-[11px] text-muted-foreground">
                  {index + 1} / {TUTORIAL_STEPS.length}
                </span>
              </div>
              <div className="mt-0.5 text-sm font-semibold text-kmg-navy">{step.title}</div>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
            </div>
          </div>

          <div className="flex gap-1 px-4">
            {TUTORIAL_STEPS.map((_, i) => (
              <span
                key={i}
                className={i <= index ? "h-1 flex-1 rounded-full bg-kmg-navy" : "h-1 flex-1 rounded-full bg-kmg-mist"}
              />
            ))}
          </div>

          <div className="flex items-center justify-between gap-2 p-3">
            <button
              onClick={onFinish}
              className="px-2 text-xs font-medium text-muted-foreground hover:text-kmg-ink"
            >
              Пропустить обучение
            </button>
            <div className="flex gap-2">
              {!isFirst && (
                <Button variant="outline" size="sm" onClick={() => setIndex((i) => i - 1)}>
                  <ArrowLeft className="h-3.5 w-3.5" /> Назад
                </Button>
              )}
              {isLast ? (
                <Button variant="accent" size="sm" onClick={onFinish}>
                  Начать День 1 <Check className="h-3.5 w-3.5" />
                </Button>
              ) : (
                <Button variant="accent" size="sm" onClick={() => setIndex((i) => i + 1)}>
                  Далее <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
