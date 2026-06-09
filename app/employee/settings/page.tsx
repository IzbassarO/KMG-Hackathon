"use client";

import { Bell, Languages, Moon, RotateCcw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/lib/store";

export default function EmployeeSettingsPage() {
  const { reset } = useStore();
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-kmg-ink">Настройки</h1>
        <p className="text-sm text-muted-foreground">
          Уведомления, язык, тема и сброс демо-данных.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-kmg-navy" /> Уведомления
            </CardTitle>
            <CardDescription>Канал и частота напоминаний.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Email" value="Включены" />
            <Row label="Push" value="Включены" />
            <Row label="MS Teams" value="Скоро" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Languages className="h-4 w-4 text-kmg-navy" /> Язык интерфейса
            </CardTitle>
            <CardDescription>Доступны русский и казахский.</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Badge variant="navy">Русский</Badge>
            <Badge variant="outline">Қазақша · скоро</Badge>
            <Badge variant="outline">English · скоро</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Moon className="h-4 w-4 text-kmg-navy" /> Тема
            </CardTitle>
            <CardDescription>Светлая, тёмная и системная — в разработке.</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Badge variant="navy">Светлая</Badge>
            <Badge variant="outline">Тёмная · скоро</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4 text-kmg-navy" /> Сброс прогресса
            </CardTitle>
            <CardDescription>
              Удалит все локальные данные и вернёт демо-набор.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={reset}>
              <RotateCcw className="h-4 w-4" /> Сбросить
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-kmg-mist px-3 py-2">
      <span>{label}</span>
      <Badge variant="secondary">{value}</Badge>
    </div>
  );
}
