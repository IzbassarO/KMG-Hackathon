"use client";

import { Building2, Mail, Phone, UserRound } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/lib/store";
import { initials } from "@/lib/utils";

export default function EmployeeTeamPage() {
  const { state, currentUser } = useStore();
  if (!currentUser) return null;
  const manager = state.users.find((u) => u.id === currentUser.managerId);
  const colleagues = state.users.filter(
    (u) => u.role === "employee" && u.department === currentUser.department && u.id !== currentUser.id
  );
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-semibold tracking-tight text-kmg-ink">
          <Building2 className="h-7 w-7 text-kmg-navy" /> Моя команда
        </h1>
        <p className="text-sm text-muted-foreground">
          {currentUser.department} · {colleagues.length + 1} сотрудников
        </p>
      </div>
      {manager && (
        <Card>
          <CardHeader>
            <CardTitle>Руководитель</CardTitle>
            <CardDescription>Главная точка контакта во время адаптации.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <Avatar className="h-14 w-14">
              <AvatarFallback>{initials(manager.fullName)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="text-lg font-semibold text-kmg-ink">{manager.fullName}</div>
              <div className="text-sm text-muted-foreground">{manager.position}</div>
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-kmg-navy">
                <span className="inline-flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" /> {manager.email}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" /> +7 (7172) 78 96 01
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader>
          <CardTitle>Коллеги</CardTitle>
          <CardDescription>Сотрудники из вашего подразделения.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {colleagues.length === 0 && (
            <div className="rounded-2xl border border-dashed border-kmg-mist p-6 text-sm text-muted-foreground">
              Пока вы единственный новый сотрудник в этом подразделении.
            </div>
          )}
          {colleagues.map((person) => (
            <div
              key={person.id}
              className="flex items-center gap-3 rounded-2xl border border-kmg-mist p-4"
            >
              <Avatar>
                <AvatarFallback>{initials(person.fullName)}</AvatarFallback>
              </Avatar>
              <div>
                <div className="text-sm font-semibold text-kmg-ink">{person.fullName}</div>
                <div className="text-xs text-muted-foreground">{person.position}</div>
                <div className="mt-1 flex gap-1">
                  <Badge variant="outline">Новый сотрудник</Badge>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
