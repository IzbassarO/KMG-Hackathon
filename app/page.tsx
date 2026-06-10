"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Database,
  GraduationCap,
  Loader2,
  Sparkles,
  Workflow,
  Building2,
  Users,
  ShieldCheck
} from "lucide-react";
import { KmgLogo } from "@/components/brand/logo";
import { LanguageThemeSwitcher } from "@/components/shell/language-switcher";
import { usePreferences } from "@/components/providers/preferences";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useStore } from "@/lib/store";
import { initials } from "@/lib/utils";
import type { Role } from "@/lib/types";

const featureCards = [
  {
    icon: Workflow,
    title: "Flowchart-тикеты",
    text: "Каждый этап онбординга — визуальный flow с задачами, ответственными и SLA."
  },
  {
    icon: Database,
    title: "RAG-ассистент",
    text: "AI отвечает на вопросы по корпоративной базе знаний и цитирует источники."
  },
  {
    icon: CalendarClock,
    title: "30/60/90 план",
    text: "План адаптации с чек-поинтами для сотрудника и наставника."
  },
  {
    icon: ShieldCheck,
    title: "Комплаенс по умолчанию",
    text: "HSE, AML и COI — встроенные обязательные модули."
  }
];

const metrics = [
  { label: "Средний срок адаптации", value: "21 день", trend: "-32%" },
  { label: "Полнота прохождения", value: "94%", trend: "+18 п.п." },
  { label: "NPS новых сотрудников", value: "72", trend: "+14" }
];

export default function LandingPage() {
  const { state, currentUser, signIn } = useStore();
  const { t } = usePreferences();
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<Role>("hr");

  const roles = useMemo(
    () => ({
      hr: state.users.filter((u) => u.role === "hr"),
      employee: state.users.filter((u) => u.role === "employee")
    }),
    [state.users]
  );

  useEffect(() => {
    if (!state.hydrated || !currentUser) return;
    router.replace(currentUser.role === "hr" ? "/hr/dashboard" : "/employee/dashboard");
  }, [currentUser, router, state.hydrated]);

  if (!state.hydrated) {
    return (
      <div className="grid min-h-screen place-items-center gradient-paper">
        <div className="flex flex-col items-center gap-3 text-kmg-navy">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-sm">Инициализация портала...</span>
        </div>
      </div>
    );
  }

  const candidates = roles[selectedRole];

  return (
    <div className="relative min-h-screen overflow-hidden gradient-paper">
      <div className="absolute inset-0 hero-grid opacity-60" />
      <div className="relative">
        <header className="container flex items-center justify-between py-6">
          <KmgLogo />
          <div className="flex items-center gap-2 md:gap-3">
            <Badge variant="outline" className="hidden md:inline-flex">
              KMG Hackathon Edition
            </Badge>
            <LanguageThemeSwitcher />
          </div>
        </header>

        <section className="container grid items-center gap-12 py-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <Badge variant="gold" className="mb-4">
              <Sparkles className="h-3.5 w-3.5" />
              AI-Powered onboarding for KMG
            </Badge>
            <h1 className="text-balance text-4xl font-semibold tracking-tight text-kmg-ink md:text-5xl">
              Единое окно онбординга для{" "}
              <span className="bg-gradient-to-r from-kmg-navy to-kmg-gold bg-clip-text text-transparent">
                HR и сотрудников
              </span>{" "}
              KMG
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
              Автоматизируйте адаптацию: визуальные flowchart-тикеты, AI-куратор на корпоративной базе знаний и
              прозрачный прогресс для каждого нового сотрудника. Всё хранится локально — RAG-инфраструктура
              подключается к защищённому контуру.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {metrics.map((m) => (
                <div
                  key={m.label}
                  className="rounded-xl border border-kmg-mist bg-white/80 p-4 shadow-card backdrop-blur"
                >
                  <div className="text-xs uppercase tracking-widest text-muted-foreground">
                    {m.label}
                  </div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="kpi-stat">{m.value}</span>
                    <span className="text-xs font-semibold text-emerald-600">{m.trend}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {featureCards.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.title}
                    className="flex items-start gap-3 rounded-2xl border border-kmg-mist bg-white p-4 shadow-card"
                  >
                    <div className="grid h-9 w-9 place-items-center rounded-lg bg-kmg-navy text-white">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-kmg-ink">{feature.title}</div>
                      <div className="text-xs text-muted-foreground">{feature.text}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <Card className="border-0 shadow-elevated">
            <CardContent className="p-0">
              <div className="rounded-t-2xl gradient-navy p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-widest text-white/60">
                      {t("landing.enterPortal")}
                    </div>
                    <h2 className="mt-1 text-2xl font-semibold">{t("landing.selectRoleTitle")}</h2>
                  </div>
                  <Building2 className="h-7 w-7 text-kmg-gold-light" />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <RoleTile
                    selected={selectedRole === "hr"}
                    onClick={() => setSelectedRole("hr")}
                    title="HR"
                    description={t("landing.hrDesc")}
                    icon={Users}
                  />
                  <RoleTile
                    selected={selectedRole === "employee"}
                    onClick={() => setSelectedRole("employee")}
                    title={t("landing.roleEmployee")}
                    description={t("landing.empDesc")}
                    icon={GraduationCap}
                  />
                </div>
              </div>
              <div className="space-y-3 p-6">
                <div className="text-xs uppercase tracking-widest text-muted-foreground">
                  {t("landing.demoAccounts")}
                </div>
                <div className="grid gap-2">
                  {candidates.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => signIn(user.id)}
                      className="group flex items-center justify-between rounded-xl border border-kmg-mist bg-white p-3 text-left transition-all hover:-translate-y-0.5 hover:border-kmg-navy/60 hover:shadow-card"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>{initials(user.fullName)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-sm font-semibold text-kmg-ink">
                            {user.fullName}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {user.position}
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:text-kmg-navy" />
                    </button>
                  ))}
                </div>
                <Button
                  variant="accent"
                  className="w-full"
                  onClick={() => candidates[0] && signIn(candidates[0].id)}
                >
                  <CheckCircle2 className="h-4 w-4" /> {t("landing.signInAs")}{" "}
                  {candidates[0]?.fullName.split(" ")[0]}
                </Button>
                <div className="text-center text-xs text-muted-foreground">
                  {t("landing.localData")}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <footer className="container mt-10 flex flex-col items-center justify-between gap-3 border-t border-kmg-mist py-6 text-xs text-muted-foreground md:flex-row">
          <span>© {new Date().getFullYear()} АО НК «КазМунайГаз» · Прототип хакатона</span>
          <div className="flex items-center gap-3">
            <span>RAG · Local-first · Flowchart-as-a-process</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

function RoleTile({
  title,
  description,
  selected,
  onClick,
  icon: Icon
}: {
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
  icon: typeof Users;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-start gap-2 rounded-xl border p-3 text-left transition-all ${
        selected
          ? "border-kmg-gold bg-white/15 ring-2 ring-kmg-gold"
          : "border-white/15 bg-white/5 hover:border-white/30"
      }`}
    >
      <Icon
        className={`h-5 w-5 ${selected ? "text-kmg-gold-light" : "text-white/80"}`}
      />
      <div>
        <div className="text-sm font-semibold">{title}</div>
        <div className="text-xs text-white/70">{description}</div>
      </div>
    </button>
  );
}
