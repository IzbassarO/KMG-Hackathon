"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT } from "@/components/providers/preferences";
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
  Wrench,
  BarChart3,
  CalendarDays,
  FolderArchive,
  HelpCircle,
  Heart,
  HeartHandshake
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
}

const hrNav: NavItem[] = [
  { href: "/hr/dashboard", label: "nav.overview", icon: LayoutDashboard },
  { href: "/hr/tickets", label: "nav.tickets", icon: Workflow, badge: "Flow" },
  { href: "/hr/employees", label: "nav.employees", icon: Users },
  { href: "/hr/mentorship", label: "nav.hrMentorship", icon: Heart },
  { href: "/hr/calendar", label: "nav.calendar", icon: CalendarDays },
  { href: "/hr/reports", label: "nav.reports", icon: BarChart3, badge: "Live" },
  { href: "/hr/learning", label: "nav.hrLearning", icon: GraduationCap },
  { href: "/hr/documents", label: "nav.documents", icon: FolderArchive },
  { href: "/hr/knowledge", label: "nav.knowledge", icon: BookOpen },
  { href: "/hr/assistant", label: "nav.assistantHr", icon: Sparkles, badge: "RAG" }
];

const hrSecondary: NavItem[] = [
  { href: "/hr/settings", label: "nav.settings", icon: Settings }
];

const empNav: NavItem[] = [
  { href: "/employee/dashboard", label: "nav.dashboard", icon: LayoutDashboard },
  { href: "/employee/journey", label: "nav.journey", icon: Compass, badge: "Flow" },
  { href: "/employee/tasks", label: "nav.tasks", icon: CalendarClock },
  { href: "/employee/calendar", label: "nav.calendar", icon: CalendarDays },
  { href: "/employee/mentorship", label: "nav.mentorship", icon: Heart },
  { href: "/employee/learning", label: "nav.learning", icon: GraduationCap },
  { href: "/employee/documents", label: "nav.documents", icon: FolderArchive },
  { href: "/employee/knowledge", label: "nav.knowledge", icon: BookOpen },
  { href: "/employee/assistant", label: "nav.assistant", icon: Wand2, badge: "RAG" }
];

const empSecondary: NavItem[] = [
  { href: "/employee/team", label: "nav.team", icon: Building2 },
  { href: "/employee/feedback", label: "nav.feedback", icon: HeartHandshake },
  { href: "/employee/help", label: "nav.help", icon: HelpCircle },
  { href: "/employee/settings", label: "nav.settings", icon: Wrench }
];

export function Sidebar({
  context,
  mobile = false
}: {
  context: "hr" | "employee";
  mobile?: boolean;
}) {
  const pathname = usePathname();
  const t = useT();
  const main = context === "hr" ? hrNav : empNav;
  const secondary = context === "hr" ? hrSecondary : empSecondary;

  return (
    <aside
      className={cn(
        "shrink-0 border-r border-kmg-mist bg-white",
        mobile ? "flex h-full w-full flex-col" : "hidden w-72 lg:flex lg:flex-col"
      )}
    >
      <div className="flex h-16 items-center border-b border-kmg-mist px-6">
        <Link href="/" className="flex items-center gap-2">
          <KmgLogo />
        </Link>
      </div>
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4 scrollbar-thin">
        <NavSectionTitle>{t("common.main")}</NavSectionTitle>
        {main.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            active={pathname === item.href || pathname?.startsWith(item.href + "/")}
          />
        ))}
        <NavSectionTitle className="mt-4">{t("common.service")}</NavSectionTitle>
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
  const t = useT();
  return (
    <Link
      href={item.href}
      data-tour={item.href}
      className={cn(
        "group flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition-all",
        active
          ? "bg-kmg-navy text-white shadow-sm"
          : "text-kmg-ink/80 hover:bg-kmg-mist/60 hover:text-kmg-ink"
      )}
    >
      <span className="flex items-center gap-3">
        <Icon className={cn("h-4 w-4", active ? "text-white" : "text-kmg-navy")} />
        {t(item.label)}
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
