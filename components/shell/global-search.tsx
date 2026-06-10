"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, LayoutDashboard, Search, User, Workflow } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useStore } from "@/lib/store";
import { useT } from "@/components/providers/preferences";

interface Result {
  id: string;
  label: string;
  sub?: string;
  href: string;
  group: Group;
}

type Group = "Разделы" | "Тикеты" | "База знаний" | "Сотрудники";

const GROUP_ORDER: Group[] = ["Разделы", "Тикеты", "База знаний", "Сотрудники"];
const GROUP_ICON: Record<Group, typeof Search> = {
  Разделы: LayoutDashboard,
  Тикеты: Workflow,
  "База знаний": BookOpen,
  Сотрудники: User
};

const SECTIONS: Record<"hr" | "employee", { label: string; href: string }[]> = {
  employee: [
    { label: "Мой день", href: "/employee/dashboard" },
    { label: "Мой путь", href: "/employee/journey" },
    { label: "Задачи", href: "/employee/tasks" },
    { label: "Календарь", href: "/employee/calendar" },
    { label: "Менторство 30/60/90", href: "/employee/mentorship" },
    { label: "Обучение", href: "/employee/learning" },
    { label: "Документы", href: "/employee/documents" },
    { label: "База знаний", href: "/employee/knowledge" },
    { label: "AI-Ассистент", href: "/employee/assistant" },
    { label: "Моя команда", href: "/employee/team" },
    { label: "Фидбэк и пульс", href: "/employee/feedback" },
    { label: "Помощь и FAQ", href: "/employee/help" },
    { label: "Настройки", href: "/employee/settings" }
  ],
  hr: [
    { label: "Обзор", href: "/hr/dashboard" },
    { label: "Тикеты онбординга", href: "/hr/tickets" },
    { label: "Сотрудники", href: "/hr/employees" },
    { label: "Менторство", href: "/hr/mentorship" },
    { label: "Календарь", href: "/hr/calendar" },
    { label: "Аналитика", href: "/hr/reports" },
    { label: "Обучение", href: "/hr/learning" },
    { label: "Документы", href: "/hr/documents" },
    { label: "База знаний", href: "/hr/knowledge" },
    { label: "AI-Куратор", href: "/hr/assistant" },
    { label: "Настройки", href: "/hr/settings" }
  ]
};

export function GlobalSearch({ context }: { context: "hr" | "employee" }) {
  const { state, currentUser } = useStore();
  const t = useT();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  const results = useMemo<Result[]>(() => {
    const query = q.trim().toLowerCase();
    if (!query) return [];
    const out: Result[] = [];

    for (const s of SECTIONS[context]) {
      if (s.label.toLowerCase().includes(query)) {
        out.push({ id: `sec-${s.href}`, label: s.label, href: s.href, group: "Разделы" });
      }
    }

    const tickets =
      context === "employee" && currentUser
        ? state.tickets.filter((t) => t.assigneeId === currentUser.id)
        : state.tickets;
    for (const t of tickets) {
      if (t.code.toLowerCase().includes(query) || t.title.toLowerCase().includes(query)) {
        out.push({
          id: `t-${t.id}`,
          label: `${t.code}: ${t.title}`,
          sub: t.category,
          href: `/${context}/tickets/${t.id}`,
          group: "Тикеты"
        });
      }
    }

    for (const k of state.knowledge) {
      if (
        k.title.toLowerCase().includes(query) ||
        k.tags.some((tag) => tag.toLowerCase().includes(query))
      ) {
        out.push({
          id: `k-${k.id}`,
          label: k.title,
          sub: k.category,
          href: `/${context}/knowledge`,
          group: "База знаний"
        });
      }
    }

    if (context === "hr") {
      for (const u of state.users.filter((u) => u.role === "employee")) {
        if (u.fullName.toLowerCase().includes(query)) {
          out.push({
            id: `u-${u.id}`,
            label: u.fullName,
            sub: u.position,
            href: `/hr/employees/${u.id}`,
            group: "Сотрудники"
          });
        }
      }
    }

    return out.slice(0, 12);
  }, [q, context, state, currentUser]);

  const grouped = GROUP_ORDER.map((group) => ({
    group,
    items: results.filter((r) => r.group === group)
  })).filter((g) => g.items.length > 0);

  function go(href: string) {
    setOpen(false);
    setQ("");
    router.push(href);
  }

  return (
    <div className="relative hidden md:block">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && results[0]) go(results[0].href);
          if (e.key === "Escape") setOpen(false);
        }}
        placeholder={t("top.search")}
        className="w-[300px] pl-9 xl:w-[360px]"
      />
      {open && q.trim() && (
        <div className="absolute left-0 z-50 mt-2 max-h-[420px] w-[360px] overflow-auto rounded-xl border border-kmg-mist bg-white p-2 shadow-elevated scrollbar-thin">
          {grouped.length === 0 ? (
            <div className="p-3 text-sm text-muted-foreground">Ничего не найдено.</div>
          ) : (
            grouped.map((g) => {
              const Icon = GROUP_ICON[g.group];
              return (
                <div key={g.group} className="mb-1">
                  <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    {g.group}
                  </div>
                  {g.items.map((r) => (
                    <button
                      key={r.id}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        go(r.href);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors hover:bg-kmg-mist/50"
                    >
                      <Icon className="h-4 w-4 shrink-0 text-kmg-navy" />
                      <span className="flex-1 truncate text-kmg-ink">{r.label}</span>
                      {r.sub && (
                        <span className="shrink-0 text-xs text-muted-foreground">{r.sub}</span>
                      )}
                    </button>
                  ))}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
