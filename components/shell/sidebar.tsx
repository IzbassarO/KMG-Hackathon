"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { KmgLogo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Workflow,
  Users,
  BookOpen,
  Sparkles,
  GraduationCap,
  CalendarClock,
  Compass,
  Settings,
  Wand2,
  Building2,
  Wrench
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
}

const hrNav: NavItem[] = [
  { href: "/hr/dashboard", label: "Обзор", icon: LayoutDashboard },
  { href: "/hr/tickets", label: "Тикеты онбординга", icon: Workflow, badge: "Flow" },
  { href: "/hr/employees", label: "Сотрудники", icon: Users },
  { href: "/hr/knowledge", label: "База знаний", icon: BookOpen },
  { href: "/hr/assistant", label: "AI-Куратор", icon: Sparkles, badge: "RAG" }
];

const hrSecondary: NavItem[] = [
  { href: "/hr/settings", label: "Настройки", icon: Settings }
];

const empNav: NavItem[] = [
  { href: "/employee/dashboard", label: "Мой день", icon: LayoutDashboard },
  { href: "/employee/journey", label: "Мой путь", icon: Compass, badge: "Flow" },
  { href: "/employee/tasks", label: "Задачи", icon: CalendarClock },
  { href: "/employee/learning", label: "Обучение", icon: GraduationCap },
  { href: "/employee/knowledge", label: "База знаний", icon: BookOpen },
  { href: "/employee/assistant", label: "AI-Ассистент", icon: Wand2, badge: "RAG" }
];

const empSecondary: NavItem[] = [
  { href: "/employee/team", label: "Моя команда", icon: Building2 },
  { href: "/employee/settings", label: "Настройки", icon: Wrench }
];

export function Sidebar({ context }: { context: "hr" | "employee" }) {
  const pathname = usePathname();
  const main = context === "hr" ? hrNav : empNav;
  const secondary = context === "hr" ? hrSecondary : empSecondary;

  return (
    <aside className="hidden w-72 shrink-0 border-r border-kmg-mist bg-white lg:flex lg:flex-col">
      <div className="flex h-16 items-center border-b border-kmg-mist px-6">
        <Link href="/" className="flex items-center gap-2">
          <KmgLogo />
        </Link>
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
        <NavSectionTitle>Основное</NavSectionTitle>
        {main.map((item) => (
          <NavLink key={item.href} item={item} active={pathname === item.href || pathname?.startsWith(item.href + "/")} />
        ))}
        <NavSectionTitle className="mt-4">Сервис</NavSectionTitle>
        {secondary.map((item) => (
          <NavLink key={item.href} item={item} active={pathname === item.href} />
        ))}
      </nav>
      <div className="m-3 mt-auto rounded-2xl border border-kmg-mist bg-gradient-to-br from-kmg-navy to-kmg-navy-light p-4 text-white shadow-elevated">
        <div className="text-xs font-semibold uppercase tracking-widest text-kmg-gold-light">
          RAG · Бета
        </div>
        <div className="mt-1 text-sm leading-snug">
          AI-помощник работает на корпоративной базе знаний KMG. Ответы цитируются.
        </div>
        <Link
          href={`/${context}/assistant`}
          className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-kmg-gold-light hover:text-white"
        >
          Открыть ассистента →
        </Link>
      </div>
    </aside>
  );
}

function NavSectionTitle({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground",
        className
      )}
    >
      {children}
    </div>
  );
}

function NavLink({ item, active }: { item: NavItem; active?: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "group flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition-all",
        active
          ? "bg-kmg-navy text-white shadow-sm"
          : "text-kmg-ink/80 hover:bg-kmg-mist/60 hover:text-kmg-ink"
      )}
    >
      <span className="flex items-center gap-3">
        <Icon className={cn("h-4 w-4", active ? "text-white" : "text-kmg-navy")} />
        {item.label}
      </span>
      {item.badge && (
        <span
          className={cn(
            "rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
            active
              ? "bg-kmg-gold text-white"
              : "bg-kmg-mist text-kmg-navy group-hover:bg-white"
          )}
        >
          {item.badge}
        </span>
      )}
    </Link>
  );
}
