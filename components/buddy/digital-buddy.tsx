"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Bell,
  Check,
  ChevronLeft,
  Compass,
  MessageCircle,
  MessageCircleQuestion,
  Play,
  Sparkles,
  X
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import {
  BUDDY_NAME,
  CHAIRMAN_VIDEO_URL,
  day1Greeting,
  getBuddyReminder
} from "@/lib/buddy";
import { getCultureCard, getDayPlan } from "@/lib/program";
import { OPEN_NOTIFICATIONS_EVENT } from "@/components/shared/notifications-sheet";
import { BuddyAvatar } from "./buddy-avatar";
import { BuddyLogo } from "./buddy-logo";
import { BuddyCharacter } from "./buddy-character";
import { BuddyTutorial } from "./buddy-tutorial";
import { BuddyChat } from "./buddy-chat";

type Mode = "day1" | "nudge" | "home" | "chat" | "notify";

const tutorialFlag = (uid: string) => `kmg.buddy.tutorial/${uid}`;
const day1Flag = (uid: string) => `kmg.buddy.day1/${uid}`;
const nudgeFlag = (uid: string, day: number) => `kmg.buddy.nudge/${uid}/${day}`;

function hasFlag(key: string) {
  return typeof window !== "undefined" && !!window.localStorage.getItem(key);
}
function setFlag(key: string) {
  if (typeof window !== "undefined") window.localStorage.setItem(key, "1");
}

export function DigitalBuddy() {
  const { state, currentUser, helpers } = useStore();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("home");
  const [hasNew, setHasNew] = useState(false);
  const [flagsV, setFlagsV] = useState(0);
  const [tutorialActive, setTutorialActive] = useState(false);
  const lastAutoDay = useRef<number | null>(null);
  const notifiedRef = useRef(false);

  const isEmployee = currentUser?.role === "employee";
  const day = currentUser && isEmployee ? helpers.getAdaptationDay(currentUser.id) : 1;
  const unread = currentUser && isEmployee ? helpers.unreadCount(currentUser.id) : 0;

  // Старт роадмапа + запуск игрового обучения при первом входе.
  useEffect(() => {
    if (!currentUser || !isEmployee) return;
    helpers.ensureOnboardingStart(currentUser.id);
    if (!hasFlag(tutorialFlag(currentUser.id))) setTutorialActive(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  // Подтягиваем уведомления о задачах/встречах дня + отчёты HR на 14/30/90 день.
  useEffect(() => {
    if (currentUser && isEmployee) {
      helpers.syncDayNotifications(currentUser.id, day);
      helpers.syncMilestoneReports(currentUser.id, day);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id, day]);

  // Авто-появление: один Digital Buddy за раз. Приоритет: День 1 → карточка дня →
  // напоминание об уведомлениях. Если что-то уже открыто — остальное ждёт.
  useEffect(() => {
    if (!currentUser || !isEmployee || !hasFlag(tutorialFlag(currentUser.id))) {
      setHasNew(false);
      return;
    }
    const uid = currentUser.id;
    const card = getCultureCard(day);
    const day1Pending = day === 1 && !hasFlag(day1Flag(uid));
    const nudgePending = !!card && !hasFlag(nudgeFlag(uid, day));

    let opened = false;
    if (lastAutoDay.current !== day && !open) {
      if (day1Pending) {
        setMode("day1");
        setOpen(true);
        opened = true;
      } else if (nudgePending && card) {
        setMode("nudge");
        setOpen(true);
        setFlag(nudgeFlag(uid, day));
        opened = true;
      }
      lastAutoDay.current = day;
    }

    if (unread === 0) notifiedRef.current = false;
    if (!open && !opened && !day1Pending && !nudgePending && unread > 0 && !notifiedRef.current) {
      setMode("notify");
      setOpen(true);
      notifiedRef.current = true;
      opened = true;
    }

    setHasNew(day1Pending || nudgePending || (unread > 0 && !notifiedRef.current));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id, day, open, flagsV, isEmployee, tutorialActive, unread]);

  if (!currentUser || !isEmployee) return null;

  const firstName = currentUser.fullName.split(" ")[0];
  const plan = getDayPlan(day);
  const card = getCultureCard(day);
  const todayItems = plan.today;
  const doneCount = todayItems.filter((i) => helpers.isPlanItemDone(currentUser.id, i.id)).length;
  const taskOfDay = todayItems.find((i) => !helpers.isPlanItemDone(currentUser.id, i.id)) ?? todayItems[0];
  const progressPct = todayItems.length ? Math.round((doneCount / todayItems.length) * 100) : 100;
  const nudgeUnseen = !!card && !hasFlag(nudgeFlag(currentUser.id, day));

  const reminder = getBuddyReminder({
    day,
    todayTotal: todayItems.length,
    todayDone: doneCount,
    hasUnseenNudge: nudgeUnseen,
    unread: state.activity.length
  });

  function openHome() {
    setMode("home");
    setOpen(true);
  }
  function openChat() {
    setMode("chat");
    setOpen(true);
  }
  function openNotifications() {
    setOpen(false);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(OPEN_NOTIFICATIONS_EVENT));
    }
  }
  function startTutorial() {
    setOpen(false);
    setTutorialActive(true);
  }
  function finishTutorial() {
    setFlag(tutorialFlag(currentUser!.id));
    setTutorialActive(false);
    lastAutoDay.current = null;
    setFlagsV((v) => v + 1);
  }
  function dismissDay1() {
    setFlag(day1Flag(currentUser!.id));
    setFlagsV((v) => v + 1);
    setOpen(false);
  }
  function close() {
    setOpen(false);
  }

  const wide = mode === "chat";

  return (
    <>
      {tutorialActive && <BuddyTutorial onFinish={finishTutorial} />}

      {/* Плавающий лаунчер — виден на всех страницах сотрудника */}
      <button
        type="button"
        onClick={openHome}
        data-tour="buddy-launcher"
        aria-label={`Открыть ${BUDDY_NAME}`}
        className="group fixed bottom-6 right-6 z-40 flex items-center gap-2"
      >
        <span className="hidden max-w-[240px] truncate rounded-full border border-kmg-mist bg-white px-3 py-1.5 text-xs font-medium text-kmg-ink shadow-card group-hover:inline-flex">
          {reminder.text}
        </span>
        <span className="relative grid h-16 w-16 animate-buddy-float place-items-center rounded-full bg-white shadow-elevated ring-2 ring-kmg-gold/40 transition group-hover:ring-kmg-gold">
          <BuddyAvatar size={56} />
          {hasNew && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-kmg-gold/70" />
              <span className="relative inline-flex h-4 w-4 rounded-full bg-kmg-gold" />
            </span>
          )}
        </span>
      </button>

      <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : close())}>
        <DialogContent className={cn("overflow-hidden p-0", wide ? "sm:max-w-2xl" : "sm:max-w-lg")}>
          {/* Шапка с аватаром + имя (ТЗ §4.2, §5.1.3) */}
          <div className="relative gradient-navy px-5 pb-4 pt-5 text-white">
            <button
              onClick={close}
              className="absolute right-4 top-4 rounded-md p-1 text-white/70 hover:text-white"
              aria-label="Закрыть"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-3">
              {mode === "chat" && (
                <button
                  onClick={() => setMode("home")}
                  className="rounded-md p-1 text-white/70 hover:text-white"
                  aria-label="Назад"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              )}
              <BuddyLogo className="h-[72px] w-auto shrink-0 drop-shadow-md" />
              <div>
                <div className="text-sm font-semibold">{BUDDY_NAME}</div>
                <div className="text-xs text-white/70">
                  {mode === "chat" ? "Чат · ответы по базе знаний" : `День ${day} · ${plan.stage.name}`}
                </div>
              </div>
            </div>
          </div>

          {mode === "day1" && (
            <Day1View
              greeting={day1Greeting(firstName)}
              taskOfDay={taskOfDay?.title}
              doneCount={doneCount}
              total={todayItems.length}
              progressPct={progressPct}
              onTutorial={startTutorial}
              onChat={openChat}
              onDone={dismissDay1}
            />
          )}

          {mode === "nudge" && card && (
            <NudgeView
              theme={card.theme}
              text={card.text}
              source={card.source}
              day={day}
              hasCourse={todayItems.some((i) => i.kind === "course")}
              onChat={openChat}
              onClose={close}
            />
          )}

          {mode === "home" && (
            <HomeView
              reminder={reminder.text}
              day={day}
              stage={plan.stage.name}
              todayCount={todayItems.length}
              doneCount={doneCount}
              eventsCount={plan.events.length}
              hasCard={Boolean(card)}
              onTutorial={startTutorial}
              onChat={openChat}
              onCard={() => card && setMode("nudge")}
              onClose={close}
            />
          )}

          {mode === "notify" && (
            <NotifyView unread={unread} onOpen={openNotifications} onLater={close} />
          )}

          {mode === "chat" && <BuddyChat />}
        </DialogContent>
      </Dialog>
    </>
  );
}

function SectionWrap({ children }: { children: React.ReactNode }) {
  return <div className="space-y-4 bg-white p-5">{children}</div>;
}

function Day1View({
  greeting,
  taskOfDay,
  doneCount,
  total,
  progressPct,
  onTutorial,
  onChat,
  onDone
}: {
  greeting: { title: string; body: string };
  taskOfDay?: string;
  doneCount: number;
  total: number;
  progressPct: number;
  onTutorial: () => void;
  onChat: () => void;
  onDone: () => void;
}) {
  return (
    <SectionWrap>
      <DialogHeader className="space-y-1 text-left">
        <DialogTitle className="text-xl text-kmg-ink">{greeting.title}</DialogTitle>
        <DialogDescription className="text-sm leading-relaxed">{greeting.body}</DialogDescription>
      </DialogHeader>

      <a
        href={CHAIRMAN_VIDEO_URL}
        className="flex items-center gap-3 rounded-2xl border border-kmg-mist bg-kmg-paper p-3 transition hover:border-kmg-navy/30"
      >
        <span className="grid h-10 w-10 place-items-center rounded-xl gradient-gold text-white">
          <Play className="h-5 w-5" />
        </span>
        <span>
          <span className="block text-sm font-semibold text-kmg-ink">
            Видеообращение Председателя Правления
          </span>
          <span className="block text-xs text-muted-foreground">Рекомендуем посмотреть в первый день</span>
        </span>
      </a>

      {taskOfDay && (
        <div className="rounded-2xl border border-kmg-mist p-3">
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Задача дня</div>
          <div className="mt-0.5 text-sm font-semibold text-kmg-ink">{taskOfDay}</div>
          <div className="text-xs text-muted-foreground">Срок — до конца дня</div>
        </div>
      )}

      <div>
        <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
          <span>Выполнено задач</span>
          <span className="font-semibold text-kmg-navy">
            {doneCount} из {total}
          </span>
        </div>
        <Progress value={progressPct} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <Button variant="outline" onClick={onTutorial}>
          <Compass className="h-4 w-4" /> Тур по порталу
        </Button>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onChat}>
            <MessageCircleQuestion className="h-4 w-4" /> Задать вопрос
          </Button>
          <Button variant="accent" onClick={onDone}>
            Понятно <Check className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </SectionWrap>
  );
}

function NudgeView({
  theme,
  text,
  source,
  day,
  hasCourse,
  onChat,
  onClose
}: {
  theme: string;
  text: string;
  source: string;
  day: number;
  hasCourse: boolean;
  onChat: () => void;
  onClose: () => void;
}) {
  return (
    <SectionWrap>
      <div className="flex items-center justify-between">
        <Badge variant="gold">
          <Sparkles className="h-3.5 w-3.5" /> Карточка культуры · день {day}
        </Badge>
        <span className="text-xs text-muted-foreground">Источник: {source}</span>
      </div>
      <DialogHeader className="space-y-1 text-left">
        <DialogTitle className="text-xl text-kmg-ink">{theme}</DialogTitle>
        <DialogDescription className="text-base leading-relaxed text-kmg-ink/80">{text}</DialogDescription>
      </DialogHeader>
      <div className="rounded-2xl border border-dashed border-kmg-mist bg-kmg-paper p-3 text-xs text-muted-foreground">
        Это одна из 23 ежедневных карточек корпоративной культуры КМГ. Завтра будет новая.
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <Button variant="ghost" onClick={onChat}>
          <MessageCircleQuestion className="h-4 w-4" /> Задать вопрос
        </Button>
        <div className="flex gap-2">
          {hasCourse && (
            <Button variant="outline" asChild onClick={onClose}>
              <Link href="/employee/learning">
                Следующий курс <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          )}
          <Button variant="accent" onClick={onClose}>
            Понятно <Check className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </SectionWrap>
  );
}

function NotifyView({
  unread,
  onOpen,
  onLater
}: {
  unread: number;
  onOpen: () => void;
  onLater: () => void;
}) {
  return (
    <SectionWrap>
      <div className="flex items-start gap-3">
        <BuddyCharacter className="h-24 w-20 shrink-0" mood="point" />
        <div className="relative flex-1 rounded-[18px] border border-kmg-mist bg-kmg-paper p-3 text-sm leading-relaxed text-kmg-ink/80">
          <span className="absolute -left-1.5 top-5 h-3 w-3 rotate-45 border-b border-l border-kmg-mist bg-kmg-paper" />
          У вас {unread}{" "}
          {unread === 1 ? "непрочитанное уведомление" : "непрочитанных уведомлений"}. Загляните,
          пожалуйста — там могут быть задачи на сегодня, встречи или сообщение от HR. Это займёт
          минуту 🙂
        </div>
      </div>
      <div className="flex items-center justify-end gap-2 pt-1">
        <Button variant="ghost" onClick={onLater}>
          Позже
        </Button>
        <Button variant="accent" onClick={onOpen}>
          <Bell className="h-4 w-4" /> Открыть уведомления
        </Button>
      </div>
    </SectionWrap>
  );
}

function HomeView({
  reminder,
  day,
  stage,
  todayCount,
  doneCount,
  eventsCount,
  hasCard,
  onTutorial,
  onChat,
  onCard,
  onClose
}: {
  reminder: string;
  day: number;
  stage: string;
  todayCount: number;
  doneCount: number;
  eventsCount: number;
  hasCard: boolean;
  onTutorial: () => void;
  onChat: () => void;
  onCard: () => void;
  onClose: () => void;
}) {
  return (
    <SectionWrap>
      <div className="flex items-start gap-3">
        <BuddyCharacter className="h-24 w-20 shrink-0" mood="wave" />
        <div className="relative flex-1 rounded-[18px] border border-kmg-mist bg-kmg-paper p-3 text-sm leading-relaxed text-kmg-ink/80">
          <span className="absolute -left-1.5 top-5 h-3 w-3 rotate-45 border-b border-l border-kmg-mist bg-kmg-paper" />
          {reminder}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Stat label="День" value={`${day}`} hint={stage} />
        <Stat label="Задач сегодня" value={`${doneCount}/${todayCount}`} />
        <Stat label="Событий" value={`${eventsCount}`} />
      </div>

      <div className="grid gap-2">
        <Button variant="accent" asChild onClick={onClose}>
          <Link href="/employee/dashboard">
            <Sparkles className="h-4 w-4" /> Открыть план на сегодня
          </Link>
        </Button>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={onChat}>
            <MessageCircle className="h-4 w-4" /> Чат с вопросом
          </Button>
          {hasCard ? (
            <Button variant="outline" onClick={onCard}>
              <Sparkles className="h-4 w-4" /> Карточка дня
            </Button>
          ) : (
            <Button variant="outline" onClick={onTutorial}>
              <Compass className="h-4 w-4" /> Тур по порталу
            </Button>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={onTutorial} className="justify-self-center">
          <Compass className="h-4 w-4" /> Пройти обучение заново
        </Button>
      </div>
    </SectionWrap>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-kmg-mist bg-white p-2.5 text-center">
      <div className="text-lg font-semibold text-kmg-navy">{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      {hint && <div className="truncate text-[10px] text-muted-foreground">{hint}</div>}
    </div>
  );
}
