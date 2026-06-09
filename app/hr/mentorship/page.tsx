"use client";

import {
  CalendarCheck2,
  Heart,
  MessageCircle,
  Plus,
  Sparkles,
  Star,
  Target,
  Users
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { useStore } from "@/lib/store";
import { initials } from "@/lib/utils";

const stages = [
  { label: "30 дней", color: "from-emerald-500 to-emerald-400" },
  { label: "60 дней", color: "from-kmg-gold to-kmg-gold-light" },
  { label: "90 дней", color: "from-kmg-navy to-kmg-navy-light" }
];

const mentors = [
  {
    id: "m1",
    name: "Айгерим Сатпаева",
    role: "HR-Директор",
    mentees: 3,
    rating: 4.9,
    expertise: ["onboarding", "culture", "L&D"]
  },
  {
    id: "m2",
    name: "Нурлан Жумабаев",
    role: "Senior HR BP",
    mentees: 4,
    rating: 4.8,
    expertise: ["onboarding", "field staff", "HSE"]
  },
  {
    id: "m3",
    name: "Самат Куанышев",
    role: "Tech Lead",
    mentees: 2,
    rating: 4.7,
    expertise: ["engineering", "GIS", "SAP"]
  }
];

export default function HrMentorshipPage() {
  const { state } = useStore();
  const employees = state.users.filter((u) => u.role === "employee");

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-semibold tracking-tight text-kmg-ink">
            <Heart className="h-7 w-7 text-kmg-gold" /> Программа менторства
          </h1>
          <p className="text-sm text-muted-foreground">
            Управление наставниками, программами 30/60/90 и контрольными точками.
          </p>
        </div>
        <Button variant="accent">
          <Plus className="h-4 w-4" /> Назначить наставника
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {stages.map((stage, idx) => (
          <Card key={stage.label}>
            <CardContent className="p-5">
              <div
                className={`mb-3 inline-flex items-center gap-2 rounded-xl bg-gradient-to-br ${stage.color} px-3 py-1 text-xs font-semibold text-white`}
              >
                <Target className="h-3.5 w-3.5" />
                {stage.label}
              </div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">
                Сотрудников на этапе
              </div>
              <div className="text-3xl font-semibold text-kmg-ink">
                {Math.max(1, employees.length - idx)}
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                Завершают этап в этом месяце
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Активные пары наставник ↔ сотрудник</CardTitle>
          <CardDescription>
            Кто за кем закреплён, прогресс адаптации и ближайшая контрольная точка.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {employees.map((emp) => {
            const mentor = mentors[Math.floor(Math.random() * mentors.length)];
            const empTickets = state.tickets.filter((t) => t.assigneeId === emp.id);
            const progress = empTickets.length
              ? Math.round(
                  empTickets.reduce((s, t) => s + t.progress, 0) / empTickets.length
                )
              : 0;
            return (
              <div
                key={emp.id}
                className="grid items-center gap-3 rounded-2xl border border-kmg-mist p-4 md:grid-cols-[1.4fr_1.2fr_1fr_auto]"
              >
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>{initials(emp.fullName)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-sm font-semibold text-kmg-ink">{emp.fullName}</div>
                    <div className="text-xs text-muted-foreground">{emp.department}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback className="bg-kmg-gold text-white">
                      {initials(mentor.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-xs uppercase tracking-widest text-muted-foreground">
                      Наставник
                    </div>
                    <div className="text-sm font-semibold text-kmg-ink">{mentor.name}</div>
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-widest text-muted-foreground">
                    Прогресс программы
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <Progress value={progress} className="flex-1" />
                    <span className="text-xs font-semibold text-kmg-navy">{progress}%</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <CalendarCheck2 className="h-4 w-4" /> 1:1
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Пул наставников</CardTitle>
          <CardDescription>
            Эксперты, готовые провести программу 30/60/90.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          {mentors.map((mentor) => (
            <div
              key={mentor.id}
              className="rounded-2xl border border-kmg-mist bg-kmg-paper p-4"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback>{initials(mentor.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-sm font-semibold text-kmg-ink">{mentor.name}</div>
                  <div className="text-xs text-muted-foreground">{mentor.role}</div>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                <Metric label="Менти" value={`${mentor.mentees}`} icon={Users} />
                <Metric label="Рейтинг" value={`${mentor.rating}`} icon={Star} />
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                {mentor.expertise.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    #{tag}
                  </Badge>
                ))}
              </div>
              <Button variant="outline" size="sm" className="mt-3 w-full">
                <Sparkles className="h-4 w-4" /> Подобрать сотрудника
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value
}: {
  icon: typeof Users;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-white p-2">
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-muted-foreground">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <div className="text-sm font-semibold text-kmg-ink">{value}</div>
    </div>
  );
}
